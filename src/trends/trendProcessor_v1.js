// Trend Processor v1
// Converts Keepa product data into clean keyword lists

export function processKeepaProducts(products = []) {
  const finalKeywords = new Set();

  for (const p of products) {
    if (!p || !p.title) continue;

    // 1. Clean title
    const title = cleanTitle(p.title);

    // 2. Extract keywords from title
    const titleKeywords = extractKeywords(title);

    // 3. Add brand as keyword
    if (p.brand && p.brand.length > 2) {
      finalKeywords.add(p.brand.toLowerCase());
    }

    // 4. Add ASIN as special keyword (useful for debugging)
    finalKeywords.add(p.asin);

    // Add processed keywords
    titleKeywords.forEach(k => finalKeywords.add(k));
  }

  return Array.from(finalKeywords);
}


// Helpers
function cleanTitle(title) {
  return title
    .replace(/\([^)]*\)/g, "")    // remove (…)
    .replace(/\[[^\]]*\]/g, "")   // remove […]
    .replace(/[^a-zA-Z0-9 ]/g, "") // remove symbols
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractKeywords(title) {
  const stopWords = [
    "for", "and", "the", "with", "from", "to", "in",
    "kit", "set", "pack", "women", "men", "kids", "boy", "girl",
    "portable", "professional", "new", "device"
  ];

  const parts = title.split(" ");

  return parts
    .filter(word => word.length > 2)
    .filter(word => !stopWords.includes(word));
}