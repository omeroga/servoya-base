import { searchKeepaProduct } from "./searchKeepa_v1.js";

export async function resolveKeepaProduct(keyword) {
  try {
    const product = await searchKeepaProduct(keyword);

    if (!product) {
      return null;
    }

    return {
      asin: product.asin || null,
      title: product.title || keyword,
      brand: product.brand || null,
      images: product.images || [],
      price: product.price || null,
    };
  } catch (err) {
    console.error("Keepa resolve error:", err.message);
    return null;
  }
}