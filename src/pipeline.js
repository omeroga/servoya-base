// pipeline.js – CTO Edition
// Full pipeline: Trend → Script → Output
// No video/audio yet (שלב הבא), זה מנוע ה-Text המלא

import { getTrendV1 } from "./trends/trendEngine_v1.js";
import { generateScript } from "./scriptEngine_v1.js";

export async function runPipeline(options = {}) {
  try {
    console.log("🚀 Pipeline starting");

    // ====== STEP 1: Get Trend ======
    const trend = await getTrendV1({
      category: options.category || null
    });

    if (!trend || !trend.keyword) {
      throw new Error("Trend Engine returned no keyword");
    }

    console.log("🔥 Trend selected:", trend);

    // ====== STEP 2: Create Script ======
    const script = await generateScript({
      category: trend.category,
      keyword: trend.keyword
    });

    if (!script) {
      throw new Error("Script Engine returned empty script");
    }

    console.log("📝 Script generated");

    // ====== FINAL OUTPUT ======
    return {
      ok: true,
      trend,
      script
    };

  } catch (err) {
    console.error("❌ Pipeline error:", err);
    return {
      ok: false,
      error: err.message
    };
  }
}