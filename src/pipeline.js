// src/pipeline.js
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

    // 1. Pick product
    const mapped = await mapProduct();
    console.log("🟣 Product mapped:", mapped);

    const asin = mapped.asin;
    if (!asin) throw new Error("ASIN missing from mapped product");

    // Create temp folder
    const tempDir = path.resolve("temp_images");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 2. Primary images
    const primary = await fetchPrimaryImages(asin, tempDir);
    console.log("🟢 Primary images:", primary);

    // 3. Gallery images from mapped URLs (if exist)
    let gallery = [];
    if (mapped.images && mapped.images.length > 0) {
      gallery = await fetchProductImages(mapped.images, asin);
    }
    console.log("🟡 Gallery images:", gallery);

    // Merge
    let finalImages = [...primary, ...gallery];

    // 4. Fallback only if needed
    if (finalImages.length === 0) {
      console.log("⚠️ Using Amazon fallback images");
      finalImages = await fallbackAmazonImages(asin, tempDir);
    }

    if (finalImages.length === 0) {
      throw new Error("No images found from any source");
    }

    // 5. Audio
    const audioPath = await fetchProductAudio(mapped);
    console.log("🔊 Audio OK:", audioPath);

    // 6. Final video
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