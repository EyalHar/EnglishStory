const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const STORY_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const STORY_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";
const CLASSIFIER_MODEL = process.env.GEMINI_CLASSIFIER_MODEL || "gemini-3.5-flash-lite";
const CLASSIFIER_FALLBACK_MODEL = process.env.GEMINI_CLASSIFIER_FALLBACK_MODEL || "gemini-2.5-flash-lite";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The free tier occasionally returns transient 503 ("high demand") or 429 (rate limit) errors,
// especially on the newest model. Retry with backoff, then fall back to an older/less-contended model.
async function generateContentWithFallback(baseParams, { models, retriesPerModel = 1, delayMs = 1500 } = {}) {
  let lastErr;
  for (const model of models) {
    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        return await ai.models.generateContent({ ...baseParams, model });
      } catch (err) {
        lastErr = err;
        const isRetryable = err?.status === 503 || err?.status === 429;
        if (!isRetryable) throw err;
        if (attempt < retriesPerModel) await sleep(delayMs * (attempt + 1));
      }
    }
  }
  throw lastErr;
}

module.exports = {
  ai,
  STORY_MODEL,
  STORY_FALLBACK_MODEL,
  CLASSIFIER_MODEL,
  CLASSIFIER_FALLBACK_MODEL,
  generateContentWithFallback,
};
