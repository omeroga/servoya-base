import { searchKeepaProducts } from "./searchKeepa_v1.js";

// לוקח תוצאה אחת טובה מתוך הרשימה
export async function resolveKeepaProduct(keyword) {
  try {
    const results = await searchKeepaProducts(keyword);

    if (!results || results.length === 0) {
      return null;
    }

    // בחירה של מוצר עם דירוג טוב (fallback: הראשון)
    const sorted =
      results.sort((a, b) => (a.rating || 0) - (b.rating || 0));

    const p = sorted[0];

    return {
      asin: p.asin,
      title: p.title || keyword,
      brand: p.brand || null,
      images: p.images || [],
      price: p.price || null,
      rating: p.rating || null,
      salesRank: p.salesRank || null
    };
  } catch (err) {
    console.error("Keepa resolve error:", err.message);
    return null;
  }
}