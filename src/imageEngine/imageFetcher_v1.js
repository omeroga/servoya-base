// src/imageFetcher_v1.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export async function fetchProductImages(images, asin) {
  const tempDir = path.resolve("temp_images");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const saved = [];

  let index = 1;
  for (const url of images) {
    try {
      const res = await fetch(url);
      const buffer = await res.buffer();

      const filePath = `${tempDir}/${asin}_${index}.jpg`;
      fs.writeFileSync(filePath, buffer);
      saved.push(filePath);
      index++;
    } catch (err) {
      console.log("image failed:", url);
    }
  }

  return saved;
}