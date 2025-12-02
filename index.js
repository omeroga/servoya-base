// index.js
import express from "express";
import * as dotenv from "dotenv";
import { runFullPipeline } from "./src/pipeline.js";

dotenv.config();

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "Servoya base backend online" });
});

// Main full pipeline endpoint
app.post("/api/generate/full", async (req, res) => {
  try {
    const options = req.body || {};
    const result = await runFullPipeline(options);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("❌ Pipeline error at /api/generate/full:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Pipeline failed",
    });
  }
});

// Backward compatible video endpoint
app.post("/api/generate/video", async (req, res) => {
  try {
    const options = req.body || {};
    const result = await runFullPipeline(options);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("❌ Pipeline error at /api/generate/video:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Pipeline failed",
    });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servoya base listening on port ${PORT}`);
});