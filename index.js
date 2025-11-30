import "dotenv/config";
import express from "express";
import { runPipeline } from "./src/pipeline.js";

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servoya base listening on port ${PORT}`);
});