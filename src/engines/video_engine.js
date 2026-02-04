import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Storage } from "@google-cloud/storage";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const storage = new Storage();

const DEFAULT_BUCKET = process.env.DEFAULT_BUCKET || "servoya-assets";
const TEMP_ROOT = path.join(os.tmpdir(), "servoya_render");
const FPS = 30;
const OUT_W = 1080;
const OUT_H = 1920;

const CLIP_CONCURRENCY = 3;
const MAX_PROJECTS_PER_RUN = 5;
const VOICE_VOL = 2.4;
const BGM_VOL = 0.14;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeJsonParse(maybeJson) {
  try {
    if (typeof maybeJson === "string") return JSON.parse(maybeJson);
    return maybeJson || {};
  } catch {
    return {};
  }
}

function wrapText(text, maxChars = 18) {
  if (!text) return "";
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + w).length > maxChars) {
      lines.push(current.trim());
      current = w + " ";
    } else {
      current += w + " ";
    }
  }
  if (current) lines.push(current.trim());
  return lines.join("\n");
}

async function downloadFromBucket(bucketName, remotePath, localDest) {
  const actualPath = String(remotePath || "").includes("storage.googleapis.com")
    ? String(remotePath).split(`${bucketName}/`)[1]
    : remotePath;

  if (!actualPath) throw new Error(`Invalid remotePath for downloadFromBucket: ${remotePath}`);
  await storage.bucket(bucketName).file(actualPath).download({ destination: localDest });
}

async function downloadAsset(url, dest) {
  const response = await axios({ url, method: "GET", responseType: "stream", timeout: 45000 });
  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);
  return new Promise((res, rej) => {
    writer.on("finish", res);
    writer.on("error", rej);
  });
}

function runCmd(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args);
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${bin} failed: ${err}`))));
  });
}

async function ffprobeDuration(filePath) {
  const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", filePath]);
  return new Promise((res) => {
    let out = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("close", () => {
      const n = parseFloat(out.trim());
      res(Number.isFinite(n) ? n : null);
    });
    p.on("error", () => res(null));
  });
}

function getRandomEffect(index) {
  const effects = [
    { name: "center-zoom", scale: "scale=1188:2112:force_original_aspect_ratio=increase", crop: "crop=1080:1920:(iw-ow)/2:(ih-oh)/2" },
    { name: "top-focus", scale: "scale=1188:2112:force_original_aspect_ratio=increase", crop: "crop=1080:1920:(iw-ow)/2:0" },
    { name: "bottom-focus", scale: "scale=1188:2112:force_original_aspect_ratio=increase", crop: "crop=1080:1920:(iw-ow)/2:(ih-oh)" },
    { name: "left-focus", scale: "scale=1296:2304:force_original_aspect_ratio=increase", crop: "crop=1080:1920:0:(ih-oh)/2" },
    { name: "right-focus", scale: "scale=1296:2304:force_original_aspect_ratio=increase", crop: "crop=1080:1920:(iw-ow):(ih-oh)/2" },
    { name: "zoom-center", scale: "scale=1242:2208:force_original_aspect_ratio=increase", crop: "crop=1080:1920:(iw-ow)/2:(ih-oh)/2" },
    { name: "tight-crop", scale: "scale=1296:2304:force_original_aspect_ratio=increase", crop: "crop=1080:1920:(iw-ow)/2:(ih-oh)/2" }
  ];
  return effects[index % effects.length];
}

function escPath(p) {
  return String(p || "").replace(/\\/g, "/").replace(/:/g, "\\\\:");
}

// ✅ FIX: correct % handling (if used anywhere else)
function escText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\/g, "\\\\\\\\")
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, "\\:")
    .replace(/%/g, "%%");
}

// ✅ FIXES APPLIED HERE:
// 1) remove text_align (not supported)
// 2) use textfile instead of text (multiline safe)
// 3) pass workDir to createClip so it can write text files
async function createClip({ imagePath, outputPath, text, durationSec, type, fontPath, index, workDir }) {
  const fontEsc = escPath(fontPath);

  const wrappedText = wrapText(text, 18).toUpperCase();
  const textFile = path.join(workDir, `text_${index}.txt`);
  fs.writeFileSync(textFile, wrappedText, "utf8");
  const textFileEsc = escPath(textFile);

  const effect = getRandomEffect(index);
  const yExpr = type === "hook" ? "250" : type === "cta" ? "(h-th)/2" : "h-550";
  const fontSize = type === "hook" ? 100 : type === "cta" ? 120 : 85;
  const fontColor = type === "body" ? "white" : "yellow";

  console.log(`  ⚡ Rendering Clip ${index + 1} with Ken Burns: ${effect.name}`);

  const filter = [
    `[0:v]scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=increase,crop=${OUT_W}:${OUT_H},boxblur=25:15[bg]`,
    `[0:v]scale=8000:-1,zoompan=z='min(zoom+0.001,1.1)':d=${FPS}*${durationSec}:s=${OUT_W}x${OUT_H}:fps=${FPS}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[fg]`,
    `[bg][fg]overlay=(W-w)/2:(H-h)/2[base]`,
    `[base]drawtext=fontfile='${fontEsc}':textfile='${textFileEsc}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-tw)/2:y=${yExpr}:box=1:boxcolor=black@0.6:boxborderw=40:line_spacing=25:shadowcolor=black@0.8:shadowx=4:shadowy=4[out]`
  ].join(";");

  await runCmd("ffmpeg", [
    "-y",
    "-t",
    Number(durationSec).toFixed(3),
    "-i",
    imagePath,
    "-filter_complex",
    filter,
    "-map",
    "[out]",
    "-r",
    String(FPS),
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "20",
    "-an",
    outputPath
  ]);
}

// ✅ FIX: mapLimit must keep correct index even when URLs repeat
async function mapLimit(items, limit, fn) {
  const results = [];
  let baseIndex = 0;

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map((item, idx) => fn(item, baseIndex + idx)));
    results.push(...batchResults);
    baseIndex += batch.length;
  }

  return results;
}

async function processProject(proj) {
  const workDir = path.join(TEMP_ROOT, `render_${proj.id}`);
  ensureDir(workDir);
  const startTime = Date.now();

  try {
    console.log(`🎬 STARTING FAST RENDER: ${proj.id}`);
    const script = safeJsonParse(proj.script_data);
    const bucket = proj.output_bucket || DEFAULT_BUCKET;

    const ttsLocal = path.join(workDir, "tts.mp3");
    const bgmLocal = path.join(workDir, "bgm.mp3");

    console.log(`📥 Downloading assets from bucket: ${bucket}...`);

    const [files] = await storage.bucket(bucket).getFiles({ prefix: "fonts/" });
    const fontFiles = (files || []).filter((f) => /\.(ttf|otf)$/i.test(f.name));
    if (fontFiles.length === 0) throw new Error("No fonts found in fonts/ folder");
    const randomFontFile = fontFiles[Math.floor(Math.random() * fontFiles.length)];
    const fontPath = path.join(workDir, "font" + path.extname(randomFontFile.name));
    await randomFontFile.download({ destination: fontPath });

    await downloadFromBucket(bucket, proj.tts_audio_path, ttsLocal);
    await downloadFromBucket(bucket, proj.audio_bg_path, bgmLocal);

    const images = Array.isArray(proj.image_urls) ? proj.image_urls : [];
    if (!images.length) throw new Error("No images");

    const targetDur = Number(proj.target_duration || 20);
    const segmentDur = targetDur / images.length;

    console.log(`⚡ Fast-rendering ${images.length} clips...`);
    const clipStart = Date.now();

    const clips = await mapLimit(images, CLIP_CONCURRENCY, async (imgBucketPath, idx) => {
      const imgPath = path.join(workDir, `img_${idx}.jpg`);
      const outPath = path.join(workDir, `clip_${idx}.mp4`);

      await downloadFromBucket(bucket, imgBucketPath, imgPath);

      let type = "body",
        txt = "";
      if (idx === 0) {
        type = "hook";
        txt = script.visual_hook_text || "OFERTA";
      } else if (idx === images.length - 1) {
        type = "cta";
        txt = script.cta_text || "LLAMA AHORA";
      } else {
        txt = script.segments?.[idx - 1]?.text || "CALIDAD";
      }

      await createClip({
        imagePath: imgPath,
        outputPath: outPath,
        text: txt,
        durationSec: segmentDur,
        type,
        fontPath,
        index: idx,
        workDir
      });

      return outPath;
    });

    console.log(`✅ Clips done in ${((Date.now() - clipStart) / 1000).toFixed(1)}s`);

    const listFile = path.join(workDir, "list.txt");
    fs.writeFileSync(listFile, clips.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));

    const finalV = path.join(workDir, "final.mp4");
    const ttsDur = (await ffprobeDuration(ttsLocal)) || targetDur;
    const speed = Math.min(Math.max(ttsDur / targetDur, 0.5), 2.0).toFixed(3);

    await runCmd("ffmpeg", [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listFile,
      "-stream_loop",
      "-1",
      "-i",
      bgmLocal,
      "-i",
      ttsLocal,
      "-filter_complex",
      `[2:a]atempo=${speed},volume=${VOICE_VOL}[v];[1:a]volume=${BGM_VOL}[b];[v][b]amix=inputs=2:duration=first[a]`,
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-t",
      String(targetDur),
      finalV
    ]);

    const readableDate = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
    const gcsDest = `output/${proj.group_name || "default"}/video_${proj.id}_${readableDate}.mp4`;

    await storage.bucket(bucket).upload(finalV, { destination: gcsDest });
    await supabase.from("production").update({ status: "completed", output_video_url: gcsDest }).eq("id", proj.id);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ SUCCESS in ${totalTime}s: ${gcsDest}`);
  } catch (err) {
    console.error(`❌ ERROR: ${err.message}`);
    await supabase.from("production").update({ status: "failed", error_message: err.message }).eq("id", proj.id);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

export async function buildVideo() {
  ensureDir(TEMP_ROOT);
  const { data } = await supabase.from("production").select("*").eq("status", "audio_generated").limit(MAX_PROJECTS_PER_RUN);
  if (data) {
    console.log(`🚀 Processing ${data.length} projects...`);
    for (const p of data) await processProject(p);
  } else {
    console.log("📭 No projects to process");
  }
}