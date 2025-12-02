// src/pipeline.js
import { fetchProductImages } from "./imageEngine/imageFetcher_v1.js";
import { fetchPrimaryImage } from "./imageEngine/imageFetcher_primary_v1.js";
import { fetchFallbackAmazon } from "./imageEngine/imageFetcher_fallbackAmazon_v1.js";
import { generateFinalVideo } from "./videoEngine_v1.js";
import { mapProduct } from "./productMapper_v1.js";
import { fetchProductAudio } from "./audioFetcher_v1.js";

export async function runFullPipeline() {
  try {
    console.log("🔵 Pipeline started");

    const mapped = await mapProduct();
    console.log("🟣 Product mapped:", mapped);

    const primaryImage = await fetchPrimaryImage(mapped);
    console.log("🟢 Primary image:", primaryImage);

    const imageList = await fetchProductImages(mapped);
    console.log("🟡 Image list:", imageList);

    let imagesToUse = imageList;

    if (!imageList || imageList.length === 0) {
      console.log("⚠️ No images from primary source, using fallback Amazon");
      const fallback = await fetchFallbackAmazon(mapped.asin);
      imagesToUse = [fallback];
    }

    const audioPath = await fetchProductAudio(mapped);
    console.log("🔊 Audio OK:", audioPath);

    const videoPath = await generateFinalVideo(imagesToUse, audioPath);
    console.log("🎬 Video generated:", videoPath);

    return {
      ok: true,
      video: videoPath
    };

  } catch (err) {
    console.error("❌ Pipeline error:", err);
    return { ok: false, error: err.message };
  }
}