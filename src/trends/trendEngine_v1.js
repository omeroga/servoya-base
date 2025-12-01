import { fetchKeepaTrends } from "./fetchKeepaTrends_v1.js";
import { processTrends } from "./trendProcessor_v1.js";
import { saveTrends } from "./trendSaver_v1.js";

// ריצה מלאה - מביא טרנדים, מעבד, שומר בבסיס
export async function runTrends(options = {}) {
  const startedAt = new Date().toISOString();

  // 1. משיכה מ־Keepa
  const rawTrends = await fetchKeepaTrends(options);

  // 2. עיבוד לטרנדים נקיים
  const processedTrends = processTrends(rawTrends, options);

  // 3. שמירה ב־Supabase
  await saveTrends(processedTrends, { startedAt });

  return {
    raw: rawTrends,
    processed: processedTrends,
    savedAt: startedAt
  };
}

// פונקציה שה־pipeline משתמש בה - מחזירה טרנד אחד "מנצח"
export async function getTrendV1(options = {}) {
  const { processed } = await runTrends(options);

  if (!processed || processed.length === 0) {
    throw new Error("No trends found in Trend Engine v1");
  }

  // לעכשיו ניקח את הראשון ברשימה
  return processed[0];
}