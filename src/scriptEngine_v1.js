// src/scriptEngine_v1.js

export async function generateScript({ trend, product }) {
  if (!trend || !product) {
    throw new Error("Missing trend or product for script generation");
  }

  const title = trend.title;
  const category = trend.category || "general";
  const brand = product.brand || "";
  const asin = product.asin || "";

  const hook =
    category === "beauty"
      ? `Stop scrolling if you want glowing, healthy skin.`
      : category === "self_improvement"
      ? `Trying to level up your daily habits? This one is going viral.`
      : category === "pets"
      ? `Pet owners, you need to see this.`
      : category === "gadgets"
      ? `If you love smart gadgets, pay attention.`
      : `Trending product you should see.`;

  const body =
    `Today's viral item: ${title}.` +
    (brand ? ` Made by ${brand}.` : "") +
    ` Perfect for anyone interested in ${category.replace("_", " ")}.` +
    ` People love it because it's practical and trending.`

  const cta =
    `Tap the link in bio to see reviews and check the current price. (ASIN: ${asin})`;

  return {
    hook,
    body,
    cta,
    full: `${hook}\n\n${body}\n\n${cta}`
  };
}