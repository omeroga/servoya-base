import { supabase } from "./supabaseClient.js";

async function test() {
  console.log("🔍 Testing Supabase connection...");

  const { data, error } = await supabase.from("videos").select("*").limit(1);

  if (error) {
    console.error("❌ Supabase Error:", error);
  } else {
    console.log("✅ Supabase OK. Rows:", data);
  }
}

test();