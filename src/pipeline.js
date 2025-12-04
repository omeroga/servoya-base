import { supabase } from "./supabaseClient.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { Storage } from "@google-cloud/storage";

dotenv.config();

// --------- GCS CLIENT ---------
const storage = new Storage();

// --------- CATEGORIES ---------
const CATEGORIES = ["beauty", "gadgets", "self_improvement", "pets"];

// --------- MAIN PIPELINE FUNCTION ---------
export async function runPipeline(categoryInput) {
  try {
    const category = normalizeCategory(categoryInput);
    if (!category) {
      return { ok: false, error: "Invalid category" };
    }

    // 1. Fetch product or trend
    const product = await fetchProductForCategory(category);
    if (!product) {
      return { ok: false, error: "No product found for category" };
    }

    // 2. Affiliate link
    const affiliateLink = buildAffiliateLink(product.asin);

    // 3. Script generation
    const script = await generateScript(category, product, affiliateLink);

    // 4. Images (7)
    const images = await fetchImages(product);
    if (images.length < 7) {
      while (images.length < 7) images.push(images[0]);
    }

    // 5. Audio from Supabase bucket
    const audioUrl = await fetchRandomAudio(category);
    if (!audioUrl) {
      return { ok: false, error: "No audio found" };
    }

    // 6. VULTR VIDEO ENGINE – CREATE VIDEO
    const videoBuffer = await callVultrVideoEngine({
      images,
      audioUrl,
      script,
      affiliateLink,
      category,
    });
    if (!videoBuffer) {
      return { ok: false, error: "Video engine failed" };
    }

    console.log("📦 VIDEO BUFFER INFO:", {
      type: typeof videoBuffer,
      isBuffer: Buffer.isBuffer(videoBuffer),
      length: videoBuffer?.length || 0,
    });

    // 7. SAVE TO GCS (SDK בלבד)
    const saveResult = await saveToGCS(videoBuffer, category);
    if (!saveResult) {
      return { ok: false, error: "GCS upload failed" };
    }
    const { url: savedUrl, size } = saveResult;

    // 7.1 VALIDATE VIDEO (על גודל הקובץ בלבד)
    const validation = validateStoredVideo(size);
    if (!validation.ok) {
      console.error("❌ VIDEO VALIDATION FAILED:", validation);
      return {
        ok: false,
        error: "Video validation failed",
        details: validation,
      };
    }

    // 8. AUTO UPLOAD
    const uploadResults = await autoUpload(savedUrl, script, category);

    // 9. Log performance
    await logRun(category, product.asin, savedUrl, uploadResults);

    return {
      ok: true,
      message: "Pipeline completed",
      product,
      affiliateLink,
      videoUrl: savedUrl,
      validation,
      uploads: uploadResults,
    };
  } catch (err) {
    console.error("❌ PIPELINE CRASH:", err);
    return { ok: false, error: err.message };
  }
}

// --------- HELPERS ---------
function normalizeCategory(c) {
  if (typeof c !== "string") return null;
  const cleaned = c.toLowerCase().trim().replace(/\s+/g, "_");
  return CATEGORIES.includes(cleaned) ? cleaned : null;
}

// 1 — Fake product fetcher
async function fetchProductForCategory(category) {
  return {
    asin: "B0TEST1234",
    title: "Top Trending Product",
  };
}

// 2 — Affiliate link builder
function buildAffiliateLink(asin) {
  const tag = process.env.AMAZON_ASSOCIATE_TAG || "servoya-20";
  return `https://www.amazon.com/dp/${asin}/?tag=${tag}`;
}

// 3 — Script from OpenAI
async function generateScript(category, product, affiliateLink) {
  const prompt = `
Write a 15-second script for a viral short video.
Category: ${category}
Product: ${product.title}
ASIN: ${product.asin}
Affiliate link: ${affiliateLink}
Tone: fast, upbeat, TikTok-style.
Include CTA at the end.
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  return (
    data.choices?.[0]?.message?.content ||
    "Amazing product! Tap to see more."
  );
}

// 4 — Fetch images
async function fetchImages(product) {
  return [
    "https://via.placeholder.com/1080x1920.png?text=Image1",
    "https://via.placeholder.com/1080x1920.png?text=Image2",
    "https://via.placeholder.com/1080x1920.png?text=Image3",
    "https://via.placeholder.com/1080x1920.png?text=Image4",
    "https://via.placeholder.com/1080x1920.png?text=Image5",
    "https://via.placeholder.com/1080x1920.png?text=Image6",
    "https://via.placeholder.com/1080x1920.png?text=Image7",
  ];
}

// 5 — Pick random audio
async function fetchRandomAudio(category) {
  const folderMap = {
    beauty: "Beauty",
    gadgets: "Gadgets",
    self_improvement: "Selfimprove",
    pets: "Pets",
  };

  const folder = folderMap[category];
  if (!folder) return null;

  const bucket = "servoya-audio";
  const path = `${folder}`;

  const { data, error } = await supabase.storage.from(bucket).list(path);
  if (error || !data || data.length === 0) return null;

  const pick = data[Math.floor(Math.random() * data.length)].name;
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(`${path}/${pick}`);

  return urlData.publicUrl || null;
}

// 6 — CALL VULTR ENGINE
async function callVultrVideoEngine(payload) {
  const url = process.env.VULTR_VIDEO_ENGINE_URL + "/api/video/generate";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

// 7 — SAVE TO GCS (SDK, בלי makePublic ובלי ACL)
async function saveToGCS(buffer, category) {
  try {
    const bucketName = process.env.GCS_BUCKET_NAME || "servoya-videos";
    const filename = `videos/${category}/servoya_${Date.now()}.mp4`;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    await file.save(buffer, {
      contentType: "video/mp4",
      resumable: false,
    });

    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size || 0);

    // URL "סטנדרטי" שאפשר לשמור בדאטה (גם אם לא ציבורי כרגע)
    const url = `https://storage.googleapis.com/${bucketName}/${filename}`;

    console.log("✅ GCS SAVE OK:", { bucketName, filename, size });

    return { url, size };
  } catch (err) {
    console.error("❌ saveToGCS error:", err);
    return null;
  }
}

// 7.1 — VALIDATION על בסיס metadata בלבד
function validateStoredVideo(size) {
  if (!size || Number.isNaN(size)) {
    return { ok: false, reason: "Missing size" };
  }

  if (size < 500000) {
    return { ok: false, reason: "File too small", size };
  }

  return { ok: true, size };
}

// 8 — AUTO UPLOAD
async function autoUpload(videoUrl, script, category) {
  return {
    youtube: "pending",
    instagram: "pending",
  };
}

// 9 — Log to Supabase
async function logRun(category, asin, videoUrl, uploads) {
  await supabase.from("performance_logs").insert({
    category,
    asin,
    video_url: videoUrl,
    uploads,
    created_at: new Date().toISOString(),
  });
}