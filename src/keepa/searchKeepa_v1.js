import dotenv from "dotenv";
dotenv.config();

const KEEPA_API_KEY = process.env.KEEPPA_API_KEY;

// using native fetch (Node 18+)
export async function searchKeepaProduct(keyword) {
  if (!keyword) throw new Error("Missing search keyword");

  const url = `https://api.keepa.com/search?key=${KEEPA_API_KEY}&domain=1&type=product&term=${encodeURIComponent(keyword)}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data || !data.products || data.products.length === 0) {
    return null;
  }

  const p = data.products[0];

  return {
    asin: p.asin,
    title: p.title || null,
    brand: p.brand || null,
    images: p.imagesCSV ? p.imagesCSV.split(",") : [],
    price: p.buyBoxPrice || null,
    rating: p.fbaFees ? p.fbaFees.reviewRating : null,
    salesRank: p.salesRankCurrent || null,
  };
}