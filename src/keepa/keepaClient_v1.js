// keepaClient_v1.js
// Central Keepa API client for Servoya
// Used by searchKeepa_v1 and resolveKeepaProduct_v1

import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.KEEPA_API_KEY;
const BASE_URL = "https://api.keepa.com";

if (!API_KEY) {
  console.error("❌ ERROR: KEEPA_API_KEY missing in .env");
  process.exit(1);
}

// Core request handler
export async function keepaRequest(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`);

  // Add required Keepa API key
  url.searchParams.set("key", API_KEY);

  // Add extra params dynamically
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url.toString());
    const json = await res.json();

    if (!res.ok || json.error) {
      console.error("❌ Keepa API error:", json);
      throw new Error(json?.error?.message || "Keepa request failed");
    }

    return json;
  } catch (err) {
    console.error("❌ Keepa client failed:", err);
    throw err;
  }
}