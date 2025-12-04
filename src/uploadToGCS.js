import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/*
  Uploads a Buffer to Google Cloud Storage using Cloud Run's service account.
  No auth header required – Cloud Run signs requests automatically.
*/

export async function uploadToGCS(buffer, filePath) {
  try {
    const bucket = process.env.GCS_BUCKET_NAME;
    if (!bucket) {
      console.error("❌ Missing GCS_BUCKET_NAME env");
      return null;
    }

    if (!buffer || !filePath) {
      console.error("❌ uploadToGCS missing buffer or filePath");
      return null;
    }

    const uploadUrl =
      `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o` +
      `?uploadType=media&name=${encodeURIComponent(filePath)}`;

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "video/mp4"
      },
      body: buffer
    });

    const json = await res.json();

    if (!res.ok || !json.mediaLink) {
      console.error("❌ GCS Upload failed:", json);
      return null;
    }

    return json.mediaLink;

  } catch (err) {
    console.error("❌ uploadToGCS error:", err);
    return null;
  }
}