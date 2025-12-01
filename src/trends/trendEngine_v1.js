// Trend Engine v1
// Orchestrates: Keepa fetch → Processing → Saving

import { fetchKeepaTrends } from "./fetchKeepaTrends_v1.js";
import { processKeepaProducts } from "./trendProcessor_v1.js";
import { saveTrends } from "./trendSaver_v1.js";

export async function runTrendEngine() {
  console.log("🚀 Running Trend Engine v1...");

  try {
    // 1. Fetch trending products from Keepa
    const products = await fetchKeepaTrends();

    if (!products || products.length === 0) {
      console.log("⚠️ No products returned from Keepa.");
      return [];
    }

    // 2. Process into clean keyword list
    const keywords = processKeepaProducts(products);

    if (!keywords || keywords.length === 0) {
      console.log("⚠️ No keywords processed.");
      return [];
    }

    console.log(`✨ Processed ${keywords.length} keywords from Keepa products.`);

    // 3. Save to Supabase
    const saved = await saveTrends(keywords);

    console.log("🏁 Trend Engine v1 completed.");
    return saved;

  } catch (err) {
    console.error("❌ Trend Engine error:", err);
    return [];
  }
}