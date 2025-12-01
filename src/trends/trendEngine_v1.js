// trendEngine_v1.js
// Dynamic Trend Engine v1 – upgraded version
// Google Trends + Reddit API (token optional) + TikTok API (token optional) + Fallback
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

// ===== Utilities =====
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isProductRelevant(str) {
  if (!str) return false;

  const banned = [
    "trump", "biden", "news", "football", "nba",
    "police", "war", "election", "celebrity",
    "crime", "politics", "covid"
  ];
  return !banned.some(b => str.toLowerCase().includes(b));
}

// Global headers to bypass bot-protection
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  "Accept": "application/json,text/html,*/*",
  "Accept-Language": "en-US,en;q=0.9"
};

// ===== Google Trends (public scrape) =====
async function fetchGoogleTrends() {
  try {
    const res = await fetch(
      "https://trends.google.com/trends/api/dailytrends?hl=en-US&geo=US&ns=15",
      { headers: BROWSER_HEADERS }
    );

    const raw = await res.text();
    const json = JSON.parse(raw.replace(")]}',", ""));

    const items = json.default.trendingSearchesDays[0].trendingSearches;

    const titles = items
      .map(item => item.title.query)
      .filter(isProductRelevant);

    return titles.slice(0, 20);
  } catch (e) {
    return [];
  }
}

// ===== Reddit API (token optional) =====
async function fetchRedditTrends(category) {
  try {
    const subs = {
      beauty: ["beauty", "SkincareAddiction", "MakeupAddiction"],
      gadgets: ["gadgets", "BuyItForLife", "tech"],
      pets: ["petproducts", "dogs", "cats"],
      self_improvement: ["selfimprovement", "getdisciplined"],
      relationships: ["relationships", "dating_advice"]
    }[category] || [];

    const collected = [];

    const authHeaders = process.env.REDDIT_TOKEN
      ? { Authorization: `Bearer ${process.env.REDDIT_TOKEN}` }
      : {};

    for (const sub of subs) {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=20`,
        { headers: { ...BROWSER_HEADERS, ...authHeaders } }
      );

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

// ===== TikTok Trends (token optional) =====
async function fetchTikTokTrends() {
  try {
    const headers = { ...BROWSER_HEADERS };

    if (process.env.TIKTOK_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.TIKTOK_TOKEN}`;
    }

    const res = await fetch(
      "https://www.tiktok.com/api/discover/item_list/?region=US",
      { headers }
    );

    const json = await res.json();

    const items = json?.itemList || [];

    return items
      .map(i => i?.desc || "")
      .filter(isProductRelevant)
      .slice(0, 20);
  } catch {
    return [];
  }
}

// ===== Category detection =====
function detectCategory(keyword) {
  const k = keyword.toLowerCase();

  if (k.includes("serum") || k.includes("skin") || k.includes("cream")) return "beauty";
  if (k.includes("journal") || k.includes("habit") || k.includes("planner")) return "self_improvement";
  if (k.includes("dog") || k.includes("cat") || k.includes("pet")) return "pets";
  if (k.includes("projector") || k.includes("charger") || k.includes("smart")) return "gadgets";
  return "relationships";
}

// ===== MAIN ENGINE =====
export async function getTrendV1(options = {}) {
  const categoryKeys = Object.keys(FALLBACK_KEYWORDS);
  const userCat = options.category || randomPick(categoryKeys);

  const [google, reddit, tiktok] = await Promise.all([
    fetchGoogleTrends(),
    fetchRedditTrends(userCat),
    fetchTikTokTrends()
  ]);

  const merged = [...google, ...reddit, ...tiktok]
    .map(s => s.trim())
    .filter(isProductRelevant);

  let keyword = merged.length ? randomPick(merged) : null;

  if (!keyword) {
    const fb = randomPick(FALLBACK_KEYWORDS[userCat]);
    return { category: userCat, keyword: fb, title: fb };
  }

  const detectedCategory = detectCategory(keyword);

  return {
    category: detectedCategory,
    keyword,
    title: keyword
  };
}

// Debug endpoint
export async function runTrendEngine() {
  return [await getTrendV1()];
}