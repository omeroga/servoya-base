import { getTrendV1 } from "./trends/trendEngine_v1.js";
import { resolveKeepaProduct } from "./keepa/resolveKeepaProduct_v1.js";
import { generateScript } from "./scriptEngine_v1.js";
import { fetchImages } from "./imageFetcher_v1.js";
import { fetchAudio } from "./audioFetcher_v1.js";
import { buildVideoFFMPEG } from "./videoEngine_ffmpeg.js";
import { logPerformance } from "./performanceLogger_v1.js";

export async function runPipeline(options = {}) {
  const startedAt = new Date().toISOString();

  try {
    // 1. Trend
    const trend = await getTrendV1(options);

    // 2. מוצר מ-Keepa לפי הטרנד
    const product = await resolveKeepaProduct(trend.title);

    if (!product) {
      await logPerformance({
        status: "no_product",
        startedAt,
        trendTitle: trend.title
      });
      throw new Error("No product found on Keepa");
    }

    // 3. Script
    const script = await generateScript({ trend, product });

    // 4. Media
    const images = await fetchImages({ product });
    const audioPath = await fetchAudio({ trend, product });

    if (!images.length || !audioPath) {
      await logPerformance({
        status: "no_media",
        startedAt,
        trendTitle: trend.title
      });
      return { trend, product, script, images, audioPath };
    }

    // 5. Video
    const outputPath = `./output/servoya_${Date.now()}.mp4`;

    const videoInfo = await buildVideoFFMPEG({
      imagePaths: images,
      audioPath,
      outputPath,
      durationPerImage: 2.0
    });

    await logPerformance({
      status: "success",
      startedAt,
      trendTitle: trend.title,
      videoPath: outputPath
    });

    return {
      trend,
      product,
      script,
      images,
      audioPath,
      videoPath: outputPath,
      ffmpeg: videoInfo
    };

  } catch (err) {
    await logPerformance({
      status: "error",
      startedAt,
      error: err.message
    });
    throw err;
  }
}