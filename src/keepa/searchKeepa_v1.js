import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const KEEPA_API_KEY = process.env.KEEPPA_API_KEY;

// מחזיר מערך תוצאות (לא תוצאה אחת)
export async function searchKeepaProducts(keyword) {
  if (!keyword) throw new Error("Missing search keyword");

  const url = `https://api.keepa.com/search?key=${KEEPA_API_KEY}&domain=1&type=product&term=${encodeURIComponent(keyword)}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data || !data.products || data.products.length === 0) {
    return [];
  }

  // ניקוי ועיצוב תוצאות
  return data.products.map(p => ({
    asin: p.asin || null,
    title: p.title || null,
    brand: p.brand || null,
    images: p.imagesCSV ? p.imagesCSV.split(",") : [],
    price: p.buyBoxPrice || null,
    rating: p.fbaFees ? p.fbaFees.reviewRating : null,
    salesRank: p.salesRankCurrent || null
  }));
}