// trendEngine_v1.js
// Dynamic Trend Engine v1 – CTO edition
// Purpose: maximize monetizable product trends for daily video generation
// Sources: Google Trends, Reddit, TikTok, Keepa API, Static fallback
// Categories: beauty, gadgets, pets, self_improvement, relationships

import fetch from "node-fetch";

// ===============================
// STATIC FALLBACK (safety net)
// ===============================
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

// ===============================
// HELPERS
// ===============================
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isProductRelevant(str) {
  const banned = ["trump", "biden", "news", "football", "nba", "police", "war", "election", "celebrity"];
  return !banned.some(b => str.toLowerCase().includes(b));
}

function detectCategory(keyword) {
  const lower = keyword.toLowerCase();
  if (lower.includes("serum") || lower.includes("skin") || lower.includes("cream")) return "beauty";
  if (lower.includes("journal") || lower.includes("habit") || lower.includes("planner")) return "self_improvement";
  if (lower.includes("dog") || lower.includes("cat") || lower.includes("pet")) return "pets";
  if (lower.includes("projector") || lower.includes("charger") || lower.includes("smart")) return "gadgets";
  return "relationships";
}

// ===============================
// GOOGLE TRENDS
// ===============================
async function fetchGoogleTrends() {
  try {
    const res = await fetch("https://trends.google.com/trends/api/dailytrends?hl=en-US&geo=US&ns=15");
    const raw = await res.text();
    const json = JSON.parse(raw.replace(")]}',", ""));

    const items = json.default.trendingSearchesDays[0].trendingSearches;
    return items.map(i => i.title.query).filter(isProductRelevant).slice(0, 20);
  } catch {
    return [];
  }
}

// ===============================
// REDDIT TRENDS
// ===============================
const REDDIT_SUBS = {
  beauty: ["beauty", "SkincareAddiction"],
  gadgets: ["gadgets", "BuyItForLife"],
  pets: ["petproducts", "dogs"],
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
      const titles = json.data.children.map(c => c.data.title).filter(isProductRelevant);
      collected.push(...titles);
    }
    return collected.slice(0, 20);
  } catch {
    return [];
  }
}

// ===============================
// TIKTOK DISCOVER
// ===============================
async function fetchTikTokTrends() {
  try {
    const res = await fetch("https://www.tiktok.com/api/discover/item_list/?region=US");
    const json = await res.json();
    return (json?.itemList || []).map(i => i.desc || "").filter(isProductRelevant).slice(0, 20);
  } catch {
    return [];
  }
}

// ===============================
// KEEPAA MEGA SOURCE
// ===============================
async function fetchKeepaTrends() {
  try {
    const apiKey = process.env.KEEPA_API_KEY;
    const url = `https://api.keepa.com/marketplace?domain=1&apikey=${apiKey}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json?.marketplaceOffers) return [];

    // Convert ASINS + Titles to trend candidates
    const products = json.marketplaceOffers
      .slice(0, 50)
      .map(p => p.title || "")
      .filter(isProductRelevant);

    return products;
  } catch {
    return [];
  }
}

// ===============================
// TREND RANK SCORING ENGINE
// ===============================
function rankTrends(google, tiktok, reddit, keepa) {
  const score = new Map();

  const add = (list, value) => {
    list.forEach(k => {
      const key = k.toLowerCase();
      score.set(key, (score.get(key) || 0) + value);
    });
  };

  add(google, 3);
  add(tiktok, 2);
  add(reddit, 2);
  add(keepa, 5); // MOST IMPORTANT – real buying demand

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword);
}

// ===============================
// MAIN ENGINE
// ===============================
export async function getTrendV1(options = {}) {
  const categoryKeys = Object.keys(FALLBACK_KEYWORDS);
  const userCategory = options.category;

  // Pull from all sources in parallel
  const [google, tiktok, reddit, keepa] = await Promise.all([
    fetchGoogleTrends(),
    fetchTikTokTrends(),
    fetchRedditTrends(userCategory || randomPick(categoryKeys)),
    fetchKeepaTrends()
  ]);

  const ranked = rankTrends(google, tiktok, reddit, keepa);

  let keyword = ranked.length > 0 ? ranked[0] : null;

  if (!keyword) {
    const cat = userCategory || randomPick(categoryKeys);
    keyword = randomPick(FALLBACK_KEYWORDS[cat]);
    return { category: cat, keyword, title: keyword };
  }

  const category = userCategory || detectCategory(keyword);

  return {
    category,
    keyword,
    title: keyword
  };
}

// Debug version
export async function runTrendEngine() {
  const trend = await getTrendV1();
  return [trend];
}