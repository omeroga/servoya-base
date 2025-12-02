import { fetchPrimaryImages } from "./imageEngine/imageFetcher_primary_v1.js";
import { fetchProductImages } from "./imageEngine/imageFetcher_v1.js";
import { fallbackAmazonImages } from "./imageEngine/imageFetcher_fallbackAmazon_v1.js";
import { generateFinalVideo } from "./videoEngine_v1.js";
import { mapProduct } from "./productMapper_v1.js";
import { fetchProductAudio } from "./audioFetcher_v1.js";

import fs from "fs";
import path from "path";

export async function runFullPipeline() {
  try {
    console.log("🔵 Pipeline started");

    // Product
    const mapped = await mapProduct();
    console.log("🟣 Product mapped:", mapped);

    const asin = mapped.asin;
    if (!asin) throw new Error("ASIN missing from mapped product");

    // Temp folder
    const tempDir = path.resolve("temp_images");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Primary images (Keepa)
    const primary = await fetchPrimaryImages(asin, tempDir);
    console.log("🟢 Primary images:", primary);

    // Gallery images (mapped.images)
    let gallery = [];
    if (mapped.images && mapped.images.length > 0) {
      gallery = await fetchProductImages(mapped.images, asin);
    }
    console.log("🟡 Gallery images:", gallery);

    let finalImages = [...primary, ...gallery];

    // Fallback Amazon
    if (finalImages.length === 0) {
      console.log("⚠️ Using Amazon fallback images");
      finalImages = await fallbackAmazonImages(asin, tempDir);
    }

    if (finalImages.length === 0)
      throw new Error("No images found from any source");

    // Audio
    const audioPath = await fetchProductAudio(mapped);
    console.log("🔊 Audio OK:", audioPath);

    // Video
    const videoPath = await generateFinalVideo(finalImages, audioPath);
    console.log("🎬 Video generated:", videoPath);

    return {
      ok: true,
      video: videoPath,
      asin
    };
  } catch (err) {
    console.error("❌ Pipeline error:", err);
    return { ok: false, error: err.message };
  }
}