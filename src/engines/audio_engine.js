import { createClient } from "@supabase/supabase-js";
import { Storage } from "@google-cloud/storage";
import fetch from "node-fetch";
import "dotenv/config";

const API_KEY = (process.env.ELEVENLABS_API_KEY || "").trim();

console.log(`DEBUG: API Key Check - Length: ${API_KEY.length}, Ends with: ${API_KEY.slice(-4)}`);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const storage = new Storage();
const BUCKET_NAME = "servoya-assets";

export async function runAudioEngine() {
    const { data: projects, error } = await supabase
        .from("production")
        .select("*")
        .eq("status", "script_generated")
        .limit(3);

    if (error) {
        console.error("Supabase error:", error.message);
        throw new Error(error.message);
    }
    
    if (!projects || projects.length === 0) {
        console.log("No projects waiting for audio generation.");
        return true;
    }

    for (const proj of projects) {
        try {
            console.log(`🎙️ DIRECT HTTP CALL: Generating audio for ${proj.id}`);
            const voiceId = proj.voice_id || "z1o4UXhrDfZ9yFTF1GMZ";

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: "POST",
                headers: {
                    "xi-api-key": API_KEY,
                    "Content-Type": "application/json",
                    "accept": "audio/mpeg"
                },
                body: JSON.stringify({
                    text: proj.script_data.tts_text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: { 
                        stability: 0.5, 
                        similarity_boost: 0.75 
                    }
                })
            });

            if (!response.ok) {
                const errDetail = await response.text();
                throw new Error(`HTTP ${response.status}: ${errDetail}`);
            }

            const fileName = `audio/tts_${proj.id}.mp3`;
            const destFile = storage.bucket(BUCKET_NAME).file(fileName);
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            await destFile.save(buffer, { 
                contentType: "audio/mpeg",
                resumable: false 
            });

            await supabase.from("production").update({
                status: "audio_generated",
                tts_audio_path: fileName
            }).eq("id", proj.id);

            console.log(`✅ SUCCESS: Audio saved to ${fileName}`);

        } catch (err) {
            console.error(`❌ FATAL TTS ERROR: ${err.message}`);
            await supabase.from("production").update({ 
                status: "failed", 
                error_message: err.message 
            }).eq("id", proj.id);
            return false;
        }
    }
    return true;
}
