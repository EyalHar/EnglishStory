const HardWord = require("../models/HardWord");
const DifficultyPatternProfile = require("../models/DifficultyPatternProfile");
const { classifyWordTopics } = require("./wordTopicClassifier");

// Only worth a Gemini call once enough new words have piled up without a topic tag.
const TOPIC_BATCH_THRESHOLD = 5;

async function ensureTopicsClassified(userId) {
  const untagged = await HardWord.find({
    userId,
    $or: [{ "metadata.topics": { $exists: false } }, { "metadata.topics": { $size: 0 } }],
  }).limit(20);

  if (untagged.length < TOPIC_BATCH_THRESHOLD) return;

  try {
    const classifications = await classifyWordTopics(untagged.map((w) => w.word));
    const topicsByWord = new Map(classifications.map((c) => [c.word.toLowerCase(), c.topics]));

    for (const hw of untagged) {
      const topics = topicsByWord.get(hw.word.toLowerCase());
      if (topics?.length) {
        hw.metadata.topics = topics;
        await hw.save();
      }
    }
  } catch (err) {
    console.log("TOPIC CLASSIFICATION ERROR:", err.message);
  }
}

function topCounts(lists, n) {
  const counts = new Map();
  lists.forEach((list) => {
    (list || []).forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

async function recomputeProfile(userId) {
  const words = await HardWord.find({ userId, status: { $in: ["active", "graduated"] } });
  if (!words.length) return null;

  const lengthBuckets = { short: 0, medium: 0, long: 0 };
  let totalLength = 0;
  let totalSyllables = 0;

  words.forEach((w) => {
    const bucket = w.metadata?.lengthBucket;
    if (bucket) lengthBuckets[bucket] += 1;
    totalLength += w.metadata?.length || 0;
    totalSyllables += w.metadata?.syllableCount || 0;
  });

  return DifficultyPatternProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      lengthBuckets,
      avgWordLength: totalLength / words.length,
      avgSyllableCount: totalSyllables / words.length,
      commonNGrams: topCounts(
        words.map((w) => w.metadata?.letterPatterns),
        8
      ).map(([ngram, count]) => ({ ngram, count })),
      weakTopics: topCounts(
        words.map((w) => w.metadata?.topics),
        5
      ).map(([topic, count]) => ({ topic, count })),
      sampleSize: words.length,
      lastComputedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

function buildPatternHintText(profile) {
  if (!profile || profile.sampleSize < 3) return "";

  const parts = [];

  if (profile.lengthBuckets.long > profile.lengthBuckets.short + profile.lengthBuckets.medium) {
    parts.push(
      `This learner tends to struggle with long words (avg ${Math.round(
        profile.avgWordLength
      )} letters) — prefer shorter, high-frequency vocabulary when introducing unfamiliar concepts.`
    );
  }

  const topNGrams = (profile.commonNGrams || []).slice(0, 3).map((n) => `"${n.ngram}"`);
  if (topNGrams.length) {
    parts.push(
      `Words containing letter sequences like ${topNGrams.join(
        ", "
      )} have been hard for this learner — where natural, favor simpler spelling patterns.`
    );
  }

  const topTopics = (profile.weakTopics || []).slice(0, 3).map((t) => t.topic);
  if (topTopics.length) {
    parts.push(
      `Weak topic areas: ${topTopics.join(", ")}. When writing about these topics, keep vocabulary simpler than usual.`
    );
  }

  return parts.join(" ");
}

async function getPatternHint(userId) {
  await ensureTopicsClassified(userId);
  const profile = await recomputeProfile(userId);
  return buildPatternHintText(profile);
}

module.exports = { getPatternHint, recomputeProfile, buildPatternHintText, ensureTopicsClassified };
