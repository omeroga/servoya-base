import { runScriptGenerator } from './script_engine.js';
import { runAudioEngine } from './audio_engine.js';
import { buildVideo } from './video_engine.js'; 

async function master() {
    console.log("🚀 --- STARTING PRODUCTION CYCLE (SERVOYA V2) --- 🚀");
    const startTime = Date.now();

    try {
        // STAGE 1
        console.log("\n[STAGE 1/3] Generating Scripts...");
        await runScriptGenerator();
        console.log("✅ Stage 1 Complete.");

        // STAGE 2
        console.log("\n[STAGE 2/3] Generating TTS Audio (ElevenLabs)...");
        const audioResult = await runAudioEngine(); 
        
        // Safety check to ensure Stage 2 actually succeeded
        if (audioResult === false) {
            throw new Error("Audio generation failed (Check API Key/Logs)");
        }
        console.log("✅ Stage 2 Complete.");

        // STAGE 3
        console.log("\n[STAGE 3/3] Rendering Final Videos...");
        await buildVideo();
        console.log("✅ Stage 3 Complete.");

        const durationMinutes = ((Date.now() - startTime) / 60000).toFixed(2);
        console.log(`\n✨ --- JOB COMPLETED IN ${durationMinutes} MINUTES --- ✨`);
        
        setTimeout(() => process.exit(0), 1000);

    } catch (error) {
        console.error("\n❌ CRITICAL SYSTEM FAILURE:");
        console.error(error.message);
        process.exit(1);
    }
}

master();
