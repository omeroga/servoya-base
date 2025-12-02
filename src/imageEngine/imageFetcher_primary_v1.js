// src/imageEngine/imageFetcher_primary_v1.js
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Proper ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fetchPrimaryImages(asin) {
  try {
    // Local temp folder
    const tempDir = path.join(__dirname, "../../temp_images");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const url = `https://api.keepa.com/product?key=${process.env.KEEPA_API_KEY}&domain=1&asin=${asin}&history=0`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.products || !json.products[0]) return [];

    const imgs = json.products[0].imagesCSV
      ? json.products[0].imagesCSV.split(",")
      : [];

    const result = [];

    for (const img of imgs) {
      const fullUrl = `https://m.media-amazon.com/images/I/${img}.jpg`;
      const filePath = path.join(tempDir, `${asin}_${img}.jpg`);

      const imgRes = await fetch(fullUrl);
      if (!imgRes.ok) continue;

      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(filePath, buf);

      result.push(filePath);
      if (result.length >= 7) break;
    }

    return result;
  } catch (err) {
    console.log("Primary image fetch error:", err.message);
    return [];
  }
}