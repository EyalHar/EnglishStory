const { STORY_MODEL, STORY_FALLBACK_MODEL, generateContentWithFallback } = require("./geminiClient");

const CEFR_GUIDANCE = {
  A1: "Very short, simple sentences (5-8 words each). Mostly present tense. Only the most common everyday words. Story length: about 100-130 words total.",
  A2: "Short sentences, simple past and present tense, everyday vocabulary. Story length: about 150-180 words total.",
  B1: "Moderate sentence length, a mix of tenses, simple linking words (because, although, so). Story length: about 200-250 words total.",
  B2: "Varied sentence structure, a wider vocabulary range, more complex tenses. Story length: about 280-320 words total.",
  C1: "Complex sentences, nuanced vocabulary, varied structure. Story length: about 350-400 words total.",
  C2: "Sophisticated, idiomatic English with complex structures and rich vocabulary. Story length: about 400-450 words total.",
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    body: { type: "string", description: "The story text, paragraphs separated by a blank line." },
    topics: { type: "array", items: { type: "string" } },
    targetWords: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          source: { type: "string", enum: ["hard", "review", "translated", "new"] },
          note: { type: "string" },
        },
        required: ["word", "source"],
      },
    },
    expressions: {
      type: "array",
      description:
        "Multi-word expressions in the story body that have a specific combined meaning different from their individual words — idioms, phrasal verbs, compound nouns, and fixed collocations (e.g. \"flea market\", \"give up\", \"make sense\"). Do NOT include ordinary word pairs with no special combined meaning.",
      items: {
        type: "object",
        properties: {
          words: {
            type: "array",
            items: { type: "string" },
            description: "The exact consecutive words as they appear in the story body, in order, lowercase.",
          },
        },
        required: ["words"],
      },
    },
  },
  required: ["title", "body", "topics", "targetWords", "expressions"],
};

function buildPrompt({ cefr, wordsToWeave, avoidTopics, patternHint }) {
  const guidance = CEFR_GUIDANCE[cefr] || CEFR_GUIDANCE.A2;

  const systemInstruction = [
    "You are an ESL reading-material writer creating short stories for English language learners.",
    `Target level: CEFR ${cefr}. ${guidance}`,
    patternHint || "",
    avoidTopics?.length ? `Avoid these topics used recently, for variety: ${avoidTopics.join(", ")}.` : "",
    "Write an engaging, self-contained short story appropriate for this level. Respond with structured JSON only.",
  ]
    .filter(Boolean)
    .join("\n");

  const contents = [
    wordsToWeave?.length
      ? `Naturally use every one of these words at least once in the story: ${wordsToWeave
          .map((w) => w.word)
          .join(", ")}.`
      : "Pick an interesting everyday topic for the story.",
    'List every word from the required list above in targetWords with its matching "source". You may also list a few other notable vocabulary words from the story with source "new".',
    "List every multi-word expression with a special combined meaning that appears in the story body in the expressions array, exactly as instructed.",
  ].join("\n");

  return { systemInstruction, contents };
}

async function generateStory({ cefr, wordsToWeave = [], avoidTopics = [], patternHint = "" }) {
  const { systemInstruction, contents } = buildPrompt({ cefr, wordsToWeave, avoidTopics, patternHint });

  const response = await generateContentWithFallback(
    {
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    },
    { models: [STORY_MODEL, STORY_FALLBACK_MODEL] }
  );

  return JSON.parse(response.text);
}

function countUniqueWords(body) {
  const matches = body.toLowerCase().match(/[a-z']+/g) || [];
  return new Set(matches).size;
}

function missingWords(body, wordsToWeave) {
  const lower = body.toLowerCase();
  return wordsToWeave
    .map((w) => w.word)
    .filter((word) => !new RegExp(`\\b${word.toLowerCase()}\\b`).test(lower));
}

module.exports = { generateStory, countUniqueWords, missingWords };
