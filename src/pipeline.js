// src/pipeline.js
import { getTrendV1 } from "./trends/trendEngine_v1.js";
import { searchKeepa } from "./keepa/searchKeepa_v1.js";
import { resolveKeepaProduct } from "./keepa/resolveKeepaProduct_v1.js";
import { fetchProductImages } from "./imageFetcher_v1.js";
import { getAudioForCategory } from "./audioFetcher_v1.js";
import { generateScript } from "./scriptEngine_v1.js";
import { generateVideo } from "./videoEngine_v1.js";
import { logPerformance } from "./performanceLogger_v1.js";

export async function runFullPipeline() {
  try {
    // 1. Trend
    const trend = await getTrendV1();

    // 2. Keepa Search
    const keepaResults = await searchKeepa(trend.keyword);
    const asin = keepaResults[0].asin;

    // 3. Keepa Product Details
    const product = await resolveKeepaProduct(asin);

    // 4. Images
    const localImages = await fetchProductImages(product.images, asin);

    // 5. Audio
    const audio = await getAudioForCategory(trend.category);

    // 6. Script
    const script = await generateScript({
      title: product.title,
      category: trend.category
    });

    // 7. Video
    const finalVideo = await generateVideo(
      localImages,
      audio,
      script.title,
      script.cta
    );

    // 8. Logging
    await logPerformance({
      asin,
      keyword: trend.keyword,
      video_path: finalVideo,
      category: trend.category
    });

    return {
      ok: true,
      asin,
      keyword: trend.keyword,
      video: finalVideo
    };
  } catch (err) {
    console.log("Pipeline error:", err);
    return { ok: false, error: err.message };
  }
}