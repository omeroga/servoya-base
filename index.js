// index.js
import express from "express";
import dotenv from "dotenv";
import { runFullPipeline } from "./src/pipeline.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, status: "Servoya base backend online" });
});

app.post("/api/generate/full", async (req, res) => {
  const result = await runFullPipeline();
  res.json(result);
});

app.listen(8080, () => {
  console.log("Servoya Base running on port 8080");
});