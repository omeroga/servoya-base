import fetch from "node-fetch";
import { supabase } from "./supabaseClient.js";

export async function getTrend() {
  return {
    title: "Fallback trend from v10",
    source: "internal"
  };
}
export async function runTrendEngine() {
  try {
    console.log("🚀 Trend Engine v10 running...");

    const sources = [
      { name: "google_trends", url: "https://api.servoya.ai/trends/google" },
      { name: "reddit", url: "https://api.servoya.ai/trends/reddit" },
      { name: "news", url: "https://api.servoya.ai/trends/news" }
    ];

    let allTrends = [];

    for (const source of sources) {
      try {
        const res = await fetch(source.url);
        const data = await res.json();
        if (data && data.trends) {
          allTrends = allTrends.concat(
            data.trends.map(t => ({
              name: t,
              source: source.name
            }))
          );
        }
      } catch (err) {
        console.error("Error loading source:", source.name, err.message);
      }
    }

    if (allTrends.length === 0) {
      console.log("❌ No trends collected.");
      return;
    }

    const { error } = await supabase.from("trends").insert(
      allTrends.map(t => ({
        trend_name: t.name,
        source: t.source,
        created_at: new Date().toISOString()
      }))
    );

    if (error) {
      console.error("❌ Supabase insert error:", error);
    } else {
      console.log("✅ Trends saved:", allTrends.length);
    }

  } catch (err) {
    console.error("❌ Trend Engine Fatal Error:", err.message);
  }
}

if (process.argv[1].includes("trendEngine_v10.js")) {
  runTrendEngine();
}