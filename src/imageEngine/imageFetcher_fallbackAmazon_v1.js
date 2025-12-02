// src/imageEngine/imageFetcher_fallbackAmazon_v1.js
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Proper dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fetchFallbackAmazon(asin) {
  try {
    // Create local temp folder
    const tempDir = path.join(__dirname, "../../temp_images");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Fallback URLs
    const imgUrls = [
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.MAIN.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.02.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.03.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.04.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.05.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.06.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.07.jpg`
    ];

    const result = [];

    for (let i = 0; i < imgUrls.length; i++) {
      const url = imgUrls[i];
      const filePath = path.join(tempDir, `${asin}_fallback_${i}.jpg`);

      const res = await fetch(url);
      if (!res.ok) continue;

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      result.push(filePath);

      if (result.length >= 7) break;
    }

    return result;
  } catch (err) {
    console.log("Fallback Amazon error:", err.message);
    return [];
  }
}