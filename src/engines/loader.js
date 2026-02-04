import { createClient } from '@supabase/supabase-js';
import { Storage } from '@google-cloud/storage';

// --- בלוק הגדרות מעודכן לבדיקה ---
const SB_URL = 'https://gpeijpqhpswggkbhnwqq.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZWlqcHFocHN3Z2drYmhud3FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk4NDYyMiwiZXhwIjoyMDc2NTYwNjIyfQ.c-eYW0cmDv-fgxto3zgt14YHoS3ZwHtEJu9t2IeSNYs';
const BUCKET_NAME = 'servoya-assets';
const PROJECT_BASE_NAME = 'omer'; 
const CONTEXT = 'Clínica dental en Zona 10, especialistas en implantes y estética. 20% de descuento este mes en Tikal Futura Centro Comercial. Tecnología avanzada, atención profesional y personalizada. Llama al 3139-0807 para tu evaluación. Ofertas de enero.';
const IMAGES_FOLDER = 'images/test/'; 
const AUDIO_FOLDER = 'audio/test/'; 
const VOICE_OPTIONS = ['z1o4UXhrDfZ9yFTF1GMZ', 'IdhxxSTaAg80CTeSgScm', 'kcQkGnn0HAT2JRDQ4Ljp'];
const TOTAL_VIDEOS = 1;
const MIN_DUR = 20;
const MAX_DUR = 20;
const IMAGE_DURATION = 4; 
// ------------------------------------------

const supabase = createClient(SB_URL, SB_KEY);
const storage = new Storage();

async function createBulkProjects() {
  console.log("Starting Loader (ElevenLabs Ready)...");

  try {
    const [imgFiles] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: IMAGES_FOLDER });
    const allImageUrls = imgFiles
      .filter(file => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
      .map(file => `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`);

    const [audioFiles] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: AUDIO_FOLDER });
    const audioPaths = audioFiles
      .filter(file => file.name.match(/\.(mp3|wav|m4a)$/i))
      .map(file => file.name);

    if (allImageUrls.length === 0) return console.log("Missing images in folder:", IMAGES_FOLDER);
    if (audioPaths.length === 0) return console.log("Missing audio in folder:", AUDIO_FOLDER);

    console.log(`Found ${allImageUrls.length} images. Generating ${TOTAL_VIDEOS} projects...`);

    for (let i = 0; i < TOTAL_VIDEOS; i++) {
      const random_duration = Math.floor(Math.random() * (MAX_DUR - MIN_DUR + 1)) + MIN_DUR;
      const randomAudio = audioPaths[Math.floor(Math.random() * audioPaths.length)];
      
      // [2] בחירת קול מהרשימה החדשה
      const selectedVoiceId = VOICE_OPTIONS[Math.floor(Math.random() * VOICE_OPTIONS.length)];

      const numImagesNeeded = Math.ceil(random_duration / IMAGE_DURATION);
      const selectedImages = allImageUrls
        .sort(() => 0.5 - Math.random())
        .slice(0, numImagesNeeded);

                        const { error } = await supabase
        .from('production')
        .insert([{
            project_name: `${PROJECT_BASE_NAME}_${i + 1}`, 
            group_name: PROJECT_BASE_NAME,                
            image_urls: selectedImages,
            context_info: CONTEXT,
            audio_bg_path: randomAudio,
            target_duration: random_duration,
            output_bucket: BUCKET_NAME,
            voice_id: selectedVoiceId, 
            status: 'pending_script',
            script_data: null // Leave this empty for the Script Engine
        }]);

      if (error) {
          console.log(`Error inserting project ${i + 1}:`, error.message);
      } else {
          console.log(`Project ${i + 1} added with VoiceID: ${selectedVoiceId}`);
      }
    }
  } catch (err) {
    console.error("Critical error in loader:", err.message);
  }
}

createBulkProjects();
