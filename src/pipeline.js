import { getTrend } from "./trendEngine_v1.js";
import { mapTrendToProduct } from "./productMapper_v1.js";
import { generateScript } from "./scriptEngine_v1.js";
import { fetchImages } from "./imageFetcher_v1.js";
import { fetchAudio } from "./audioFetcher_v1.js";
import { buildVideoFFMPEG } from "./videoEngine_ffmpeg.js";
import { logPerformance } from "./performanceLogger_v1.js";

export async function runPipeline(options = {}) {
  const startedAt = new Date().toISOString();
  try {
    const trend = await getTrend(options);
    const mapping = mapTrendToProduct(trend.title);
    const script = await generateScript({ trend, mapping });
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

    if (!images.length || !audioPath) {
      await logPerformance({
        status: "no_media",
        startedAt,
        trendTitle: trend.title,
        reason: !images.length ? "no_images" : "no_audio"
      });
      return result;
    }

    const outputPath = `./output/servoya_${Date.now()}.mp4`;
    const videoInfo = await buildVideoFFMPEG({
      imagePaths: images,
      audioPath,
      outputPath,
      durationPerImage: 2.0
    });

    result.videoPath = outputPath;
    result.ffmpeg = videoInfo;

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