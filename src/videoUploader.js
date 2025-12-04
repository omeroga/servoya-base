// src/videoUploader.js
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

export async function uploadVideoToGCS(buffer) {
  // תמיד יוצרים storage בתוך הפונקציה
  const storage = new Storage();

  // המשתנה הנכון
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME is missing in environment");
  }

  const bucket = storage.bucket(bucketName);

  const id = randomUUID();
  const fileName = `video_${id}.mp4`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    contentType: "video/mp4",
    public: false
  });

  return {
    ok: true,
    fileName,
    gsPath: `gs://${bucketName}/${fileName}`
  };
}