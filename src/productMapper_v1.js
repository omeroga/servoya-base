// productMapper_v1.js
// Servoya CTO Edition – Dec 2025
// Converts raw Keepa product data → unified product object for Script Engine + Video Engine

export function mapKeepaProduct(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("mapKeepaProduct: invalid Keepa product");
  }

  // --- Title ---
  const title =
    raw.title ||
    raw.items?.[0]?.title ||
    raw.parent?.title ||
    "Unknown product";

  // --- ASIN ---
  const asin =
    raw.asin ||
    raw.items?.[0]?.asin ||
    raw.parent?.asin ||
    null;

  // --- Brand ---
  const brand =
    raw.brand ||
    raw.items?.[0]?.brand ||
    raw.parent?.brand ||
    "Unknown";

  // --- Price Extraction ---
  let price = null;
  try {
    // Keepa uses cents * 100
    const offer = raw.buyBoxSellerIdHistory?.[0] || null;
    if (raw.buyBoxPrice) {
      price = (raw.buyBoxPrice / 100).toFixed(2);
    } else if (raw.items?.[0]?.buyBoxPrice) {
      price = (raw.items[0].buyBoxPrice / 100).toFixed(2);
    }
  } catch {
    price = null;
  }

  // --- BEST IMAGE SELECTION ---
  // Priority: imagesCSV > images > largeImage > fallback
  const images = [];

  if (raw.imagesCSV) {
    images.push(
      ...raw.imagesCSV.split(",").map((x) => `https://m.media-amazon.com/images/I/${x}.jpg`)
    );
  }

  if (Array.isArray(raw.images)) {
    for (const img of raw.images) {
      images.push(img);
    }
  }

  if (raw.largeImage) {
    images.push(raw.largeImage);
  }

  // filter duplicates + invalid URLs
  const cleanImages = [...new Set(images)].filter((url) =>
    typeof url === "string" &&
    url.startsWith("http")
  );

  // pick top 7 images
  const selectedImages = cleanImages.slice(0, 7);

  if (selectedImages.length === 0) {
    throw new Error("mapKeepaProduct: no images available");
  }

  // --- Result ---
  return {
    asin,
    title,
    brand,
    price,
    images: selectedImages,
    primaryImage: selectedImages[0],
    keyword: title.toLowerCase(), // fallback for Script Engine
  };
}