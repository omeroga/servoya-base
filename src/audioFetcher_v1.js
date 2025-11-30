import fs from "fs";
import path from "path";

export async function fetchAudio({ trend, mapping }) {
  const base = new URL("..", import.meta.url).pathname;
  const folder = path.join(base, "assets", "audio", mapping.niche || "general");

  if (!fs.existsSync(folder)) {
    console.warn("Audio folder not found:", folder);
    return null;
  }

  const files = fs.readdirSync(folder)
    .filter(f => f.match(/\.(mp3|wav|m4a)$/i))
    .map(f => path.join(folder, f));

  return files[0] || null;
}