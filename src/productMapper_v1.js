export function mapTrendToProduct(title = "") {
  const t = title.toLowerCase();

  if (t.includes("serum") || t.includes("face") || t.includes("skin")) {
    return {
      category: "beauty",
      intent: "skincare_product",
      niche: "beauty"
    };
  }

  if (t.includes("projector") || t.includes("led")) {
    return {
      category: "gadgets",
      intent: "home_projector",
      niche: "smart_gadgets"
    };
  }

  return {
    category: "general",
    intent: "generic_product",
    niche: "general"
  };
}