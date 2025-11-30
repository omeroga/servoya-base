import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error("❌ Missing Supabase env keys:", {
    SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceRole
  });
  throw new Error("Missing Supabase credentials");
}

export const supabase = createClient(url, serviceRole, {
  auth: {
    persistSession: false
  }
});