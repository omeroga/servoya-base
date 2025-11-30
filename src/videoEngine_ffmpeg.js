import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

export async function buildVideoFFMPEG({ imagePaths, audioPath, outputPath, durationPerImage = 2.0 }) {
  if (!imagePaths || !imagePaths.length) {
    throw new Error("No images given to buildVideoFFMPEG");
  }
  if (!audioPath) {
    throw new Error("No audioPath given to buildVideoFFMPEG");
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const listPath = path.join(outDir, `images_${Date.now()}.txt`);
  const lines = [];
  for (const img of imagePaths) {
    lines.push(`file '${img.replace(/'/g, "'\\''")}'`);
    lines.push(`duration ${durationPerImage}`);
  }
  fs.writeFileSync(listPath, lines.join("\n"), "utf8");

  const cmd = [
    "ffmpeg -y",
    `-f concat -safe 0 -i "${listPath}"`,
    `-i "${audioPath}"`,
    "-shortest",
    "-c:v libx264 -preset veryfast",
    "-c:a aac -b:a 128k",
    `"${outputPath}"`
  ].join(" ");

  const { stdout, stderr } = await execAsync(cmd);
  return { ok: true, stdout, stderr, output: outputPath };
}