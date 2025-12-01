import fetch from "node-fetch";

// Load env variables
import dotenv from "dotenv";
dotenv.config();

const KEEPPA_API_KEY = process.env.KEEPPA_API_KEY;

if (!KEEPPA_API_KEY) {
  console.error("❌ Missing KEEPPA_API_KEY in .env");
  process.exit(1);
}

/*
  Fetch trending products from Keepa using category BEST_SELLERS

  Notes:
  - domainId 1 = US market
  - We request products from "Movers & Shakers" + Best Sellers
  - Response returns ASINs, and we must decode them using Keepa product API
*/

export async function fetchKeepaTrends() {
  try {
    console.log("📡 Fetching Keepa trending products...");

    const searchUrl = `https://api.keepa.com/bestsellers?api_key=${KEEPPA_API_KEY}&domain=1&category=0`;

    const res = await fetch(searchUrl);
    const data = await res.json();

    if (!data || !data.bestsellers) {
      console.log("⚠️ No bestseller data received from Keepa.");
      return [];
    }

    // Extract ASIN list
    const asinList = data.bestsellers.slice(0, 20); // take top 20
    console.log(`✓ Received ${asinList.length} ASINs from Keepa`);

    // Fetch product details for each ASIN
    const productDetails = await fetchProductDetails(asinList);

    return productDetails;

  } catch (err) {
    console.error("❌ Keepa fetch error:", err);
    return [];
  }
}

// Fetch details (price, title, sales rank)
async function fetchProductDetails(asinList) {
  const result = [];

  for (const asin of asinList) {
    const url = `https://api.keepa.com/product?api_key=${KEEPPA_API_KEY}&domain=1&asin=${asin}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data || !data.products || !data.products[0]) continue;

      const p = data.products[0];

      result.push({
        asin,
        title: p.title || "Unknown",
        brand: p.brand || "Unknown",
        drops: p.drops || 0,
        salesRankCurrent: p.salesRankCurrent || null,
        last30DaysDrops: p.drops30 || 0,
      });

    } catch (err) {
      console.error(`⚠️ Error fetching details for ${asin}`, err);
      continue;
    }
  }

  console.log(`✓ Fetched details for ${result.length} products`);
  return result;
}