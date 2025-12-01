import { searchKeepaProducts } from "./searchKeepa_v1.js";

export async function resolveKeepaProduct(keyword) {
  try {
    const results = await searchKeepaProducts(keyword);

    if (!results || results.length === 0) {
      return null;
    }

    // ניקח את התוצאה הכי טובה
    const p = results[0];

    return {
      asin: p.asin || null,
      title: p.title || keyword,
      brand: p.brand || null,
      images: p.images || [],
      price: p.price || null
    };

  } catch (err) {
    console.error("Keepa resolve error:", err.message);
    return null;
  }
}