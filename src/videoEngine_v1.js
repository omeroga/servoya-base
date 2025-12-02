// src/videoEngine_v1.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function generateVideo(images, audioPath, title, cta) {
  const outputDir = "output";
  const tempDir = "temp_video";

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const duration = 2.14;
  const chunks = [];
  let counter = 1;

  // build 7 chunks
  for (const img of images) {
    const abs = path.resolve(img).replace(/\\/g, "/");
    const out = `${tempDir}/chunk_${counter}.mp4`;
    chunks.push(out);

    const cmd =
      `ffmpeg -y -loop 1 -i "${abs}" -t ${duration} ` +
      `-vf "scale=1080:1920:force_original_aspect_ratio=increase,` +
      `fade=t=in:st=0:d=0.4,fade=t=out:st=${duration - 0.4}:d=0.4"` +
      ` -c:v libx264 -pix_fmt yuv420p -r 30 "${out}"`;

    execSync(cmd, { stdio: "inherit", shell: true });
    counter++;
  }

  // concat
  const concatFile = "chunks.txt";
  let content = "";
  for (const c of chunks) {
    content += `file '${path.resolve(c).replace(/\\/g, "/")}'\n`;
  }
  fs.writeFileSync(concatFile, content);

  const rawVideo = "output/raw.mp4";

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${rawVideo}"`,
    { stdio: "inherit", shell: true }
  );

  // Final overlay
  const timestamp = Date.now();
  const final = `output/final_${timestamp}.mp4`;

  const overlay =
    `drawtext=text='${title}':x=40:y=100:fontsize=60:fontcolor=white:shadowcolor=black:shadowx=3:shadowy=3,` +
    `drawtext=text='${cta}':x=40:y=1700:fontsize=50:fontcolor=yellow:shadowcolor=black:shadowx=3:shadowy=3`;

  execSync(
    `ffmpeg -y -i "${rawVideo}" -i "${audioPath}" -filter_complex "${overlay}" ` +
      `-t 15 -c:v libx264 -pix_fmt yuv420p "${final}"`,
    { stdio: "inherit", shell: true }
  );

  return final;
}