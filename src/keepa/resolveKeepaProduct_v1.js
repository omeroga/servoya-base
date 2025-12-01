import { searchKeepaProduct } from "./searchKeepa_v1.js";

export async function resolveKeepaProduct(keyword) {
  try {
    const p = await searchKeepaProduct(keyword);

    if (!p) {
      return null;
    }

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