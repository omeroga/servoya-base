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
    // 1. Fetch trend
    const trend = await getTrendV1(options);
    if (!trend || !trend.title) {
      throw new Error("Trend engine returned empty trend");
    }

    // 2. Map trend to Amazon product using Keepa
    const mapping = await resolveKeepaProduct(trend.title);

    if (!mapping) {
      throw new Error("No matching Amazon product found for: " + trend.title);
    }

    // 3. Generate script
    const script = await generateScript({ trend, mapping });

    // 4. Fetch media
    const images = await fetchImages({ trend, mapping });
    const audioPath = await fetchAudio({ trend, mapping });

    const result = {
      trend,
      mapping,
      script,
      images,
      audioPath,
      videoPath: null
    };

    // 5. Validate media
    if (!images.length || !audioPath) {
      await logPerformance({
        status: "no_media",
        startedAt,
        trendTitle: trend.title,
        reason: !images.length ? "no_images" : "no_audio"
      });
      return result;
    }

    // 6. Build video
    const outputPath = `./output/servoya_${Date.now()}.mp4`;

    const videoInfo = await buildVideoFFMPEG({
      imagePaths: images,
      audioPath,
      outputPath,
      durationPerImage: 2.0
    });

    result.videoPath = outputPath;
    result.ffmpeg = videoInfo;

    // 7. Log performance
    await logPerformance({
      status: "success",
      startedAt,
      trendTitle: trend.title,
      videoPath: outputPath
    });

    return result;

  } catch (err) {
    await logPerformance({
      status: "error",
      startedAt,
      error: err.message || String(err)
    });
    throw err;
  }
}