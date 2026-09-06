const { CLASSIFIER_MODEL, CLASSIFIER_FALLBACK_MODEL, generateContentWithFallback } = require("./geminiClient");

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    phrase: {
      type: "string",
      description: "The exact word or multi-word expression being translated, lowercase, as it appears in the text.",
    },
    translation: {
      type: "string",
      description: "Hebrew translation of that phrase, matching its meaning in this specific context.",
    },
  },
  required: ["phrase", "translation"],
};

async function translateToHebrew(word, context) {
  const contents = [
    context ? `Context: "${context}"` : "",
    `Translate "${word}" as it is used in this context into Hebrew for a language learner.`,
    `If "${word}" is (or is part of) a multi-word expression, idiom, phrasal verb, or compound noun that has a specific combined meaning here (for example "flea" inside "flea market", or "give" inside "give up"), identify the full expression and translate THAT expression instead of a single word alone.`,
    "Return the exact expression you translated (one or more words, lowercase, as it appears in the text) and its Hebrew translation for this context.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await generateContentWithFallback(
    {
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    },
    { models: [CLASSIFIER_MODEL, CLASSIFIER_FALLBACK_MODEL] }
  );

  return JSON.parse(response.text);
}

module.exports = { translateToHebrew };
