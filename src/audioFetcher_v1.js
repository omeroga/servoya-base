// src/audioFetcher_v1.js
import { supabase } from "./supabaseClient.js";

export async function getAudioForCategory(category) {
  const folder = "general"; // later per category

  const { data, error } = await supabase.storage
    .from("audio")
    .list(folder);

  if (error || !data || data.length === 0) {
    return "assets/audio/general/track1.mp3";
  }

  const random = data[Math.floor(Math.random() * data.length)].name;

  return `assets/audio/general/${random}`;
}