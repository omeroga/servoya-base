// src/imageEngine/imageFetcher_v1.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

// Correct ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch gallery images from Keepa-provided URLs
 * Used only when primary images exist
 */
export async function fetchProductImages(images, asin) {
  try {
    // Local temp folder
    const tempDir = path.join(__dirname, "../../temp_images");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const result = [];
    let index = 1;

    for (const url of images) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.log("❌ Skipped bad gallery URL:", url);
          continue;
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        const file = path.join(tempDir, `${asin}_gallery_${index}.jpg`);
        fs.writeFileSync(file, buffer);
        result.push(file);
        index++;

        if (result.length >= 7) break;
      } catch (err) {
        console.log("❌ Gallery image fetch error for:", url, err.message);
      }
    }

    return result;
  } catch (err) {
    console.log("❌ ImageFetcher_v1 general error:", err.message);
    return [];
  }
}