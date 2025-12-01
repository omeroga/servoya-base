import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const KEEPPA_API_KEY = process.env.KEEPPA_API_KEY;

// קטגוריות Keepa לפי domain 1 (US)
const KEEPPA_CATEGORIES = {
  beauty: 11060451,
  gadgets: 502394,
  kitchen: 284507,
  home: 1055398,
  pets: 2975241011,
  self_improvement: "mix"
};

export async function fetchKeepaTrends(category = "beauty") {
  console.log(`📡 Fetching Keepa products for category: ${category}`);

  if (category === "self_improvement") {
    return await fetchMixedSelfImprovement();
  }

  const catId = KEEPPA_CATEGORIES[category];

  if (!catId || typeof catId !== "number") {
    console.error(`❌ Unknown or invalid category: ${category}`);
    return [];
  }

  try {
    const url = `https://api.keepa.com/bestsellers?key=${KEEPPA_API_KEY}&domain=1&category=${catId}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.bestsellers) return [];
    const asinList = data.bestsellers.slice(0, 15);

    return await fetchAsinDetails(asinList);

  } catch (err) {
    console.error("❌ Keepa fetch error:", err);
    return [];
  }
}

async function fetchMixedSelfImprovement() {
  const mixCats = ["gadgets", "home", "kitchen"];

  let final = [];

  for (const cat of mixCats) {
    const catId = KEEPPA_CATEGORIES[cat];
    const url = `https://api.keepa.com/bestsellers?key=${KEEPPA_API_KEY}&domain=1&category=${catId}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.bestsellers) {
        final.push(...data.bestsellers.slice(0, 5));
      }
    } catch {
      continue;
    }
  }

  final = [...new Set(final)].slice(0, 20);
  return await fetchAsinDetails(final);
}

async function fetchAsinDetails(asins) {
  const out = [];

  for (const asin of asins) {
    try {
      const url = `https://api.keepa.com/product?key=${KEEPPA_API_KEY}&domain=1&asin=${asin}`;
      const res = await fetch(url);
      const data = await res.json();

      const p = data.products?.[0];
      if (!p) continue;

      out.push({
        asin,
        title: p.title || null,
        brand: p.brand || null,
        rating: p.stats?.rating || null,
        reviews: p.stats?.reviewCount || null,
        drops30: p.drops30 || 0,
        salesRank: p.salesRankCurrent || null
      });

    } catch {
      continue;
    }
  }

  return out;
}