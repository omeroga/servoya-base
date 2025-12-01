import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import { runPipeline } from "./src/pipeline.js";
import { runTrendEngine } from "./src/trends/trendEngine_v1.js";
import { exec } from "child_process";

const app = express();
app.use(express.json());

// GitHub webhook - לבדיקת חיבור אוטומטי מ-GitHub לשרת
app.post("/webhook/github", (req, res) => {
  console.log("📥 GitHub Webhook received:", req.body);
  res.status(200).send("ok");
});

// Healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "Servoya base backend online" });
});

// ▶️ Run Trend Engine manually
app.post("/run-trends", async (req, res) => {
  try {
    const result = await runTrendEngine();
    res.json({ ok: true, trends: result });
  } catch (err) {
    console.error("❌ Trend Engine API error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// יצירת וידאו
app.post("/api/generate/video", async (req, res) => {
  try {
    const options = req.body || {};
    const result = await runPipeline(options);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("Pipeline error:", err);
    res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
});

// GitHub Webhook for deploy
app.post("/deploy", (req, res) => {
  exec("bash /root/servoya/deploy.sh", (error, stdout, stderr) => {
    if (error) {
      console.error(`Deploy error: ${error.message}`);
      return res.status(500).send("Deploy failed");
    }
    if (stderr) {
      console.error(`Deploy stderr: ${stderr}`);
    }
    console.log(stdout);
    res.send("Deploy complete");
  });
});

const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log(`Servoya base listening on port ${PORT}`);
});