import { supabase } from "../supabaseClient.js";

/*
  Save list of keywords into Supabase trends table.
  Each keyword will be inserted with:
  - source: keepa
  - country: US
  - score: 1 (default)
*/

export async function saveTrends(keywords = []) {
  if (!keywords || keywords.length === 0) {
    console.log("⚠️ No keywords to save.");
    return [];
  }

  console.log(`💾 Saving ${keywords.length} trends to Supabase...`);

  const rows = keywords.map(k => ({
    keyword: k,
    source: "keepa",
    country: "US",
    score: 1,
  }));

  const { data, error } = await supabase
    .from("trends")
    .insert(rows);

  if (error) {
    console.error("❌ Supabase insert error:", error);
    return [];
  }

  console.log(`✓ Saved ${data.length} trends.`);
  return data;
}