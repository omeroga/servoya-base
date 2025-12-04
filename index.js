// index.js – Servoya Base (Production Stable v2)
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

import { uploadVideoToGCS } from "./src/videoUploader.js";
import { runPipeline } from "./src/pipeline.js";

const app = express();
app.use(express.json());

// Health
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "servoya-base online" });
});

// Pipeline route
app.post("/api/pipeline/run", async (req, res) => {
  try {
    const category = req.body?.category; // חוצה את הערך הנכון
    const result = await runPipeline(category);
    return res.json(result);
  } catch (err) {
    console.error("Pipeline error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Proxy → Vultr Video Engine
app.post("/api/video/generate", async (req, res) => {
  try {
    const base = process.env.VULTR_VIDEO_ENGINE_URL;
    if (!base) {
      return res
        .status(500)
        .json({ ok: false, error: "Missing VULTR_VIDEO_ENGINE_URL env" });
    }

    const vultrUrl = `${base}/api/video/generate`;

    const vultrRes = await fetch(vultrUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {})
    });

    if (!vultrRes.ok) {
      const body = await vultrRes.text();
      return res.status(500).json({ ok: false, error: "Vultr failed", body });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=servoya_video.mp4`
    );

    vultrRes.body.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Upload video to GCS
app.post("/api/video/upload", async (req, res) => {
  try {
    if (!req.body || !req.body.base64) {
      return res.status(400).json({ ok: false, error: "Missing base64" });
    }

    const buffer = Buffer.from(req.body.base64, "base64");
    const result = await uploadVideoToGCS(buffer);

    return res.json({
      ok: true,
      file: result.fileName,
      path: result.gsPath
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
app.listen(8080, () => {
  console.log("🚀 servoya-base running on port 8080");
});