import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export async function fallbackAmazonImages(asin, tempDir) {
  try {
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
      const file = path.join(tempDir, `fallback_${i}.jpg`);

      const res = await fetch(url);
      if (!res.ok) continue;

      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(file, buf);
      result.push(file);

      if (result.length >= 7) break;
    }

    return result;
  } catch {
    return [];
  }
}