import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const MODEL = "gpt-4o-mini";

const LOCKED_THEME = "YELLOW_BLACK";
const LOCKED_SPEED = 1.15;

const SECONDS_PER_IMAGE = 3;

const FORBIDDEN_WORDS = [
  "basta ya",
  "bienvenido",
  "hola",
  "descubre",
  "molestias",
  "atención",
];

const ANGLES = [
  {
    style: "SHOCK_REVEAL",
    systemPrompt:
      "Start with a direct benefit or result. Aggressive, professional marketing language. No greetings. No fake news tone.",
  },
  {
    style: "LOCAL_HACK",
    systemPrompt:
      "Frame it as a smart move in Guatemala. Sharp, factual, practical. Avoid exaggerated claims.",
  },
  {
    style: "URGENT_PROBLEM",
    systemPrompt:
      "Highlight immediate pain and a fast exit. High energy, but keep it credible and business-safe.",
  },
];

function norm(str) {
  return String(str || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(str) {
  return norm(str).split(" ").filter(Boolean).length;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsForbidden(text) {
  const t = norm(text);
  for (const w of FORBIDDEN_WORDS) {
    const rw = new RegExp(`\\b${escapeRegExp(norm(w))}\\b`, "i");
    if (rw.test(t)) return true;
  }
  return false;
}

function segmentsContainedInTTS(tts, segments) {
  const t = norm(tts);
  for (const seg of segments) {
    const s = norm(seg?.text);
    if (!s) return false;
    if (!t.includes(s)) return false;
  }
  return true;
}

function validateScript(parsed, rules) {
  try {
    if (!parsed || typeof parsed !== "object") return { ok: false, reason: "not_object" };

    const hook = String(parsed.visual_hook_text || "").trim();
    const cta = String(parsed.cta_text || "").trim();
    const tts = String(parsed.tts_text || "").trim();
    const segments = Array.isArray(parsed.segments) ? parsed.segments : [];

    if (!hook || !cta || !tts) return { ok: false, reason: "missing_fields" };

    const ttsWc = wordCount(tts);
    if (ttsWc < rules.minWords || ttsWc > rules.maxWords) {
      return { ok: false, reason: `tts_words_${ttsWc}_not_in_${rules.minWords}-${rules.maxWords}` };
    }

    if (wordCount(hook) > rules.hookMaxWords) return { ok: false, reason: "hook_too_long" };
    if (wordCount(cta) > rules.ctaMaxWords) return { ok: false, reason: "cta_too_long" };

    if (segments.length !== rules.segmentCount) {
      return { ok: false, reason: `segments_count_${segments.length}_not_${rules.segmentCount}` };
    }

    for (let i = 0; i < segments.length; i++) {
      const segText = String(segments[i]?.text || "").trim();
      if (!segText) return { ok: false, reason: `segment_${i}_empty` };

      const wc = wordCount(segText);
      if (wc < rules.segmentMinWords || wc > rules.segmentMaxWords) {
        return { ok: false, reason: `segment_${i}_words_${wc}_not_in_${rules.segmentMinWords}-${rules.segmentMaxWords}` };
      }
    }

    const combined = `${hook} ${cta} ${tts}`;
    if (containsForbidden(combined)) return { ok: false, reason: "forbidden_words" };

    if (!segmentsContainedInTTS(tts, segments)) return { ok: false, reason: "segments_not_in_tts" };

    return { ok: true, reason: "ok" };
  } catch {
    return { ok: false, reason: "validation_exception" };
  }
}

// --- פונקציה מתוקנת: buildPrompt ---
function buildPrompt({ topic, anglePrompt, rules }) {
  return `
You are a Spanish marketing copywriter for Guatemala.
Write punchy, credible short-form video copy for a local business.

TOPIC:
${topic}

ANGLE:
${anglePrompt}

STRICT RULES:
- No greetings.
- Do NOT use these words/phrases: ${FORBIDDEN_WORDS.join(", ")}.
- visual_hook_text: max ${rules.hookMaxWords} words.
- cta_text: max ${rules.ctaMaxWords} words.
- segments: EXACTLY ${rules.segmentCount} items.
  - Each segment text must be ${rules.segmentMinWords}-${rules.segmentMaxWords} words.
  - Each segment must appear verbatim (as a substring, case-insensitive) inside tts_text.
- tts_text: MUST BE EXACTLY ${rules.exactWordCount} WORDS. This is critical for 30fps timing. Use high energy.

OUTPUT:
Return JSON ONLY, no markdown, no comments.

SCHEMA:
{
  "visual_hook_text": "",
  "segments": [{"text": ""}],
  "tts_text": "",
  "cta_text": ""
}
`.trim();
}

function buildRepairPrompt({ previousJson, failReason, rules }) {
  return `
You returned JSON that failed validation.

FAIL REASON:
${failReason}

Your job:
- Return a corrected JSON ONLY (same schema).
- Keep the same topic and intent.
- Must satisfy all rules exactly.

RULES REMINDER:
- visual_hook_text max ${rules.hookMaxWords} words.
- cta_text max ${rules.ctaMaxWords} words.
- segments EXACTLY ${rules.segmentCount} items.
- segment words ${rules.segmentMinWords}-${rules.segmentMaxWords}.
- Each segment must appear as a substring inside tts_text (case-insensitive).
- tts_text: MUST BE EXACTLY ${rules.exactWordCount} WORDS.
- Forbidden: ${FORBIDDEN_WORDS.join(", ")}.

PREVIOUS JSON:
${JSON.stringify(previousJson)}
`.trim();
}

async function callJson(prompt, { temperature = 0.7 } = {}) {
  const res = await openai.chat.completions.create({
    model: MODEL,
    temperature,
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = res?.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

async function generateViralScript(proj, retries = 4) {
  const duration = Number(proj.target_duration || 20);
  
  // Dynamic word calculation based on duration
  const baseWords = Math.floor(duration * 2.2);

  const totalAssets = Math.max(3, Math.floor(duration / SECONDS_PER_IMAGE));
  const segmentCount = Math.max(1, totalAssets - 2);

  const rules = {
    segmentCount,
    hookMaxWords: 6, // Slightly increased for flexibility
    ctaMaxWords: 6,  // Slightly increased for flexibility
    segmentMinWords: 1,
    segmentMaxWords: 8,
    // Flexible Range: Giving GPT a 10-word window
    minWords: baseWords - 10,
    maxWords: baseWords + 10,
    exactWordCount: baseWords // For the prompt instruction
  };

  const topic = String(proj.context_info || "").trim() || "Negocio local en Guatemala";
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

  const basePrompt = buildPrompt({
    topic,
    anglePrompt: angle.systemPrompt,
    rules,
  });

  let lastParsed = null;
  let lastReason = "none";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Use lower temperature for more precision on word counts
      const temperature = attempt === 1 ? 0.5 : 0.7;

      const parsed = await callJson(attempt === 1 ? basePrompt : buildRepairPrompt({
        previousJson: lastParsed || { visual_hook_text: "", segments: [{ text: "" }], tts_text: "", cta_text: "" },
        failReason: lastReason,
        rules,
      }), { temperature });

      lastParsed = parsed;

      const v = validateScript(parsed, rules);
      lastReason = v.reason;

      if (v.ok) {
        return {
          angle_type: angle.style,
          visual_hook_text: String(parsed.visual_hook_text || "").toUpperCase(),
          visual_hook_theme: LOCKED_THEME,
          speed: LOCKED_SPEED,
          segments: (parsed.segments || []).map(s => ({ text: String(s.text || "").toUpperCase() })),
          tts_text: String(parsed.tts_text || ""),
          cta_text: String(parsed.cta_text || "").toUpperCase(),
        };
      }
    } catch (e) {
      lastReason = `exception_${String(e?.message || e)}`;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  throw new Error(`Script failed validation: ${lastReason}`);
}

export async function runScriptGenerator() {
  const { data: projects, error } = await supabase
    .from("production")
    .select("*")
    .eq("status", "pending_script")
    .limit(5);

  if (error) throw new Error(error.message);
  if (!projects || projects.length === 0) return;

  for (const proj of projects) {
    try {
      const result = await generateViralScript(proj);

      await supabase
        .from("production")
        .update({
          script_data: {
            segments: result.segments,
            tts_text: result.tts_text,
            voice_id: proj.voice_id,
            speed: result.speed,
            visual_hook_text: result.visual_hook_text,
            visual_hook_theme: result.visual_hook_theme,
            cta_text: result.cta_text,
          },
          angle_type: result.angle_type,
          status: "script_generated",
          error_message: null,
        })
        .eq("id", proj.id);

      console.log(`✅ Script OK: ${proj.id}`);
    } catch (err) {
      const msg = String(err?.message || err);
      console.error(`❌ Script FAIL ${proj.id}: ${msg}`);

      await supabase
        .from("production")
        .update({ status: "failed", error_message: msg })
        .eq("id", proj.id);
    }
  }
}
