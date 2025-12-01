// index.js - clean version, no RTL characters
import dotenv from "dotenv";
dotenv.config();

import { exec } from "child_process";
import express from "express";

import { runPipeline } from "./src/pipeline.js";
import { runTrendEngine } from "./src/trends/trendEngine_v1.js";
import { searchKeepaProduct } from "./src/keepa/searchKeepa_v1.js";

const app = express();
app.use(express.json());

// GitHub webhook listener
app.post("/webhook/github", (req, res) => {
  console.log("GitHub Webhook received:", req.body);
  res.status(200).send("ok");
});

// Healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "Servoya base backend online" });
});

// Trend engine route
app.post("/run-trends", async (req, res) => {
  try {
    const result = await runTrendEngine();
    res.json({ ok: true, trends: result });
  } catch (err) {
    console.error("Trend Engine API error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// TEST KEPA ROUTE
app.post("/test-keepa", async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ ok: false, error: "Missing keyword" });
    }

    const product = await searchKeepaProduct(keyword);
    res.json({ ok: true, product });
  } catch (err) {
    console.error("Keepa test error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Video generation
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

// Deploy hook
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

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servoya base listening on port ${PORT}`);
});