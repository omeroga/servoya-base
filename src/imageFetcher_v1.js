import fs from "fs";
import path from "path";

export async function fetchImages({ trend, mapping }) {
  const base = new URL("..", import.meta.url).pathname;
  const folder = path.join(base, "assets", "images", mapping.niche || "general");

  if (!fs.existsSync(folder)) {
    console.warn("Images folder not found:", folder);
    return [];
  }

  const files = fs.readdirSync(folder)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .map(f => path.join(folder, f));

  return files.slice(0, 7);
}