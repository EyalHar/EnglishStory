const { CLASSIFIER_MODEL, CLASSIFIER_FALLBACK_MODEL, generateContentWithFallback } = require("./geminiClient");

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    classifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          topics: {
            type: "array",
            items: { type: "string" },
            description: "1-2 short lowercase topic/domain tags, e.g. 'business', 'nature', 'food', 'technology', 'travel', 'emotions'.",
          },
        },
        required: ["word", "topics"],
      },
    },
  },
  required: ["classifications"],
};

async function classifyWordTopics(words) {
  if (!words.length) return [];

  const response = await generateContentWithFallback(
    {
      contents: `Classify each of these English words into 1-2 short topic/domain tags (lowercase). Words: ${words.join(", ")}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    },
    { models: [CLASSIFIER_MODEL, CLASSIFIER_FALLBACK_MODEL] }
  );

  return JSON.parse(response.text).classifications;
}

module.exports = { classifyWordTopics };
