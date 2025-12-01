// src/trends/trendEngine_v1.js

// מנוע טרנדים v1 - יציב לחודש הקרוב
// בוחר נושא לפי קטגוריה מתוך ספרייה פנימית, בלי Keepa

const CATEGORY_KEYWORDS = {
  beauty: [
    "vitamin c face serum",
    "retinol anti aging serum",
    "hyaluronic acid moisturizer",
    "korean skincare routine set",
    "facial sunscreen for daily use"
  ],
  pets: [
    "no pull dog harness",
    "automatic cat water fountain",
    "interactive dog puzzle toy",
    "self cleaning cat litter box",
    "dog car seat for small dogs"
  ],
  gadgets: [
    "wireless earbuds with noise cancelling",
    "portable blender for smoothies",
    "mini projector for home theater",
    "magnetic phone charger",
    "smartwatch for fitness tracking"
  ],
  self_improvement: [
    "daily gratitude journal",
    "habit tracker planner",
    "mindfulness meditation book",
    "time management productivity planner",
    "affirmation cards for confidence"
  ],
  relationships: [
    "couple matching bracelets",
    "anniversary gift for her",
    "couple games for date night",
    "romantic gift box for girlfriend",
    "conversation cards for couples"
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// מחזיר מערך של טרנד אחד בשביל /run-trends
export async function runTrendEngine(options = {}) {
  const categoryKeys = Object.keys(CATEGORY_KEYWORDS);

  // 1. בוחרים קטגוריה
  let category = options.category;
  if (!category || !CATEGORY_KEYWORDS[category]) {
    category = pickRandom(categoryKeys);
  }

  // 2. בוחרים מילה בתוך הקטגוריה
  const keywords = CATEGORY_KEYWORDS[category];
  const keyword = options.keyword && keywords.includes(options.keyword)
    ? options.keyword
    : pickRandom(keywords);

  const trend = {
    category,          // למשל "beauty"
    keyword,           // המחרוזת המקורית
    title: keyword     // הפייפליין משתמש בזה ל־mapTrendToProduct + script
  };

  console.log(`🚀 Trend Engine v1 picked category=${category}, keyword="${keyword}"`);

  return [trend];
}

// מחזיר טרנד אחד לפייפליין
export async function getTrendV1(options = {}) {
  const list = await runTrendEngine(options);

  if (list && list.length > 0) {
    return list[0];
  }

  // fallback חירום שלא יפיל את המערכת
  return {
    category: "beauty",
    keyword: "vitamin c face serum",
    title: "vitamin c face serum"
  };
}