import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export async function fetchPrimaryImages(asin, tempDir) {
  try {
    const url = `https://api.keepa.com/product?key=${process.env.KEEPA_API_KEY}&domain=1&asin=${asin}&history=0`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.products || !json.products[0]) return [];

    const imgs = json.products[0].imagesCSV
      ? json.products[0].imagesCSV.split(",")
      : [];

    const result = [];

    for (const img of imgs) {
      const full = `https://m.media-amazon.com/images/I/${img}.jpg`;
      const file = path.join(tempDir, `${img}.jpg`);
      const imgRes = await fetch(full);

      if (!imgRes.ok) continue;

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(file, buffer);
      result.push(file);

      if (result.length >= 7) break;
    }

    return result;
  } catch (err) {
    return [];
  }
}