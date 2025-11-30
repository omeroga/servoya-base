export async function generateScript({ trend, mapping }) {
  const title = trend.title;
  const category = mapping.category;

  const hook = `Stop scrolling if you love ${category === "beauty" ? "glowing skin" : "smart home upgrades"}.`;
  const body = `Here is a viral product right now: ${title}. Imagine using it in your daily routine.`;
  const cta = "Tap the link in bio to check current price and reviews.";

  return {
    hook,
    body,
    cta,
    full: `${hook}\n\n${body}\n\n${cta}`
  };
}