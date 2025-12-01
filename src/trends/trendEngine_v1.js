// trendEngine_v1.js
// Dynamic Trend Engine v1 – final integrated version
// Sources: Google Trends scrape + Reddit API + TikTok scrape + Static fallback
// Categories: beauty, gadgets, pets, self_improvement, relationships

import fetch from "node-fetch";

// ===== Static fallback =====
const FALLBACK_KEYWORDS = {
  beauty: [
    "vitamin c face serum",
    "retinol anti aging serum",
    "hyaluronic acid moisturizer",
    "korean skincare routine set",
    "facial sunscreen for daily use"
  ],
  gadgets: [
    "wireless earbuds with noise cancelling",
    "portable blender",
    "mini projector",
    "magnetic phone charger",
    "smartwatch for fitness tracking"
  ],
  pets: [
    "no pull dog harness",
    "automatic cat water fountain",
    "interactive dog puzzle toy",
    "self cleaning cat litter box",
    "dog car seat"
  ],
  self_improvement: [
    "daily gratitude journal",
    "habit tracker planner",
    "mindfulness meditation book",
    "time management productivity planner",
    "affirmation cards"
  ],
  relationships: [
    "couple matching bracelets",
    "anniversary gift",
    "couple games for date night",
    "romantic gift box",
    "conversation cards"
  ]
};

// ===== Utility =====
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isProductRelevant(str) {
  const banned = [
    "trump", "biden", "news", "football", "nba",
    "police", "war", "election", "celebrity"
  ];
  return !banned.some(b => str.toLowerCase().includes(b));
}

// ===== Google Trends (scrape public page) =====
async function fetchGoogleTrends() {
  try {
    const res = await fetch("https://trends.google.com/trends/api/dailytrends?hl=en-US&geo=US&ns=15");
    const raw = await res.text();

    // Google adds )]}'
    const json = JSON.parse(raw.replace(")]}',", ""));

    const items = json.default.trendingSearchesDays[0].trendingSearches;
    const results = items
      .map(item => item.title.query)
      .filter(isProductRelevant);

    return results.slice(0, 20);
  } catch {
    return [];
  }
}

// ===== Reddit API =====
const REDDIT_SUBS = {
  beauty: ["beauty", "SkincareAddiction", "MakeupAddiction"],
  gadgets: ["gadgets", "BuyItForLife", "tech"],
  pets: ["petproducts", "dogs", "cats"],
  self_improvement: ["selfimprovement", "getdisciplined"],
  relationships: ["relationships", "dating_advice"]
};

async function fetchRedditTrends(category) {
  try {
    const subs = REDDIT_SUBS[category] || [];
    const collected = [];

    for (const sub of subs) {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=20`);
      const json = await res.json();

      const titles = json.data.children
        .map(p => p.data.title)
        .filter(isProductRelevant);

      collected.push(...titles);
    }

    return collected.slice(0, 20);
  } catch {
    return [];
  }
}

// ===== TikTok Trends (public discover page) =====
async function fetchTikTokTrends() {
  try {
    const res = await fetch("https://www.tiktok.com/api/discover/item_list/?region=US");
    const json = await res.json();

    const items = json?.itemList || [];
    const titles = items
      .map(i => i?.desc || "")
      .filter(isProductRelevant);

    return titles.slice(0, 20);
  } catch {
    return [];
  }
}

// ===== Category detection =====
function detectCategory(keyword) {
  const lower = keyword.toLowerCase();

  if (lower.includes("serum") || lower.includes("skin") || lower.includes("cream")) return "beauty";
  if (lower.includes("journal") || lower.includes("habit") || lower.includes("planner")) return "self_improvement";
  if (lower.includes("dog") || lower.includes("cat") || lower.includes("pet")) return "pets";
  if (lower.includes("projector") || lower.includes("charger") || lower.includes("smart")) return "gadgets";
  return "relationships";
}

// ===== Main Engine =====
export async function getTrendV1(options = {}) {
  const categoryKeys = Object.keys(FALLBACK_KEYWORDS);
  const userCategory = options.category;

  // 1. ===== pull from 3 dynamic sources =====
  const [google, tiktok] = await Promise.all([
    fetchGoogleTrends(),
    fetchTikTokTrends()
  ]);

  const reddit = await fetchRedditTrends(userCategory || randomPick(categoryKeys));

  const merged = [...google, ...reddit, ...tiktok]
    .map(s => s.trim())
    .filter(isProductRelevant);

  // 2. ===== choose keyword =====
  let keyword = merged.length > 0 ? randomPick(merged) : null;

  // 3. ===== fallback =====
  if (!keyword) {
    const cat = userCategory || randomPick(categoryKeys);
    keyword = randomPick(FALLBACK_KEYWORDS[cat]);
    return {
      category: cat,
      keyword,
      title: keyword
    };
  }

  // 4. ===== auto detect category =====
  const detectedCategory = userCategory || detectCategory(keyword);

  return {
    category: detectedCategory,
    keyword,
    title: keyword
  };
}

// debug endpoint version
export async function runTrendEngine() {
  const trend = await getTrendV1();
  return [trend];
}