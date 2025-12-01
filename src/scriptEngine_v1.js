// src/scriptEngine_v1.js
// גרסה יציבה וללא תלות ב-mapping

export async function generateScript({ trend, product }) {
  const title = trend?.title || "Trending Product";
  const category = trend?.category || "general";

  const hook = `Stop scrolling if you care about ${category}!`;
  const body = `This product is trending right now: ${title}. It solves a real problem and people love it.`;
  const cta = "Tap the link in bio to see current price and reviews.";

  return {
    hook,
    body,
    cta,
    full: `${hook}\n\n${body}\n\n${cta}`
  };
}