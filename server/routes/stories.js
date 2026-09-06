const express = require("express");
const User = require("../models/User");
const Story = require("../models/Story");
const ReadingSession = require("../models/ReadingSession");
const HardWord = require("../models/HardWord");
const TranslatedWord = require("../models/TranslatedWord");
const { authMiddleware } = require("../middleware/auth");
const { generateStory, missingWords } = require("../services/storyGeneration");
const { ACTIVE_HARD_WORD_BACKOFF_THRESHOLD } = require("../services/levelModel");
const { pickDueReviewWords } = require("../services/spacedRepetition");
const { getPatternHint } = require("../services/patternDetection");

const router = express.Router();

router.post("/next", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ googleId: req.user.googleId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const recentStories = await Story.find({ userId: user.googleId })
      .sort({ createdAt: -1 })
      .limit(3);
    const avoidTopics = recentStories.flatMap((s) => s.topics || []);

    // Back off the number of hard words we push into one story if too many have piled up —
    // mirrors the level-adjustment backoff so a struggling reader isn't overloaded further.
    const activeHardWordCount = await HardWord.countDocuments({
      userId: user.googleId,
      status: "active",
    });
    const hardWordLimit = activeHardWordCount > ACTIVE_HARD_WORD_BACKOFF_THRESHOLD ? 3 : 6;

    const activeHardWords = await HardWord.find({ userId: user.googleId, status: "active" })
      .sort({ timesMarkedHard: -1, lastMarkedAt: -1 })
      .limit(hardWordLimit);

    const recentTranslations = await TranslatedWord.find({ userId: user.googleId })
      .sort({ timestamp: -1 })
      .limit(20);
    const hardWordSet = new Set(activeHardWords.map((w) => w.word));
    const translatedWords = [...new Set(recentTranslations.map((t) => t.word))]
      .filter((w) => !hardWordSet.has(w))
      .slice(0, 3);

    // Graduated words due for spaced-repetition review — reappear occasionally so they aren't forgotten.
    const reviewWords = await pickDueReviewWords(HardWord, user.googleId, user.stats.storiesCompleted);

    const wordsToWeave = [
      ...activeHardWords.map((w) => ({ word: w.word, source: "hard" })),
      ...translatedWords.map((w) => ({ word: w, source: "translated" })),
      ...reviewWords.map((w) => ({ word: w.word, source: "review" })),
    ];

    // Detects patterns in what this learner struggles with (long words, letter sequences, weak
    // topics) and turns them into a natural-language hint for the story-generation prompt.
    const patternHint = await getPatternHint(user.googleId);

    const generated = await generateStory({ cefr: user.level.cefr, wordsToWeave, avoidTopics, patternHint });

    const missing = missingWords(generated.body, generated.targetWords || []);
    if (missing.length) {
      console.log("Story generation dropped requested words:", missing);
    }

    const story = await Story.create({
      userId: user.googleId,
      title: generated.title,
      body: generated.body,
      level: { score: user.level.score, cefr: user.level.cefr },
      topics: generated.topics || [],
      targetWords: generated.targetWords || [],
      expressions: generated.expressions || [],
      generationParams: { levelScore: user.level.score, avoidTopics, patternHint },
    });

    const session = await ReadingSession.create({
      userId: user.googleId,
      storyId: story._id,
      status: "active",
    });

    res.json({ story, sessionId: session._id });
  } catch (err) {
    console.log("STORY GENERATION ERROR:", err.message);
    res.status(500).json({ error: "Failed to generate story" });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  const stories = await Story.find({ userId: req.user.googleId })
    .sort({ createdAt: -1 })
    .select("title level topics createdAt");

  const sessions = await ReadingSession.find({
    userId: req.user.googleId,
    storyId: { $in: stories.map((s) => s._id) },
  }).select("storyId status");
  const sessionByStory = new Map(sessions.map((s) => [String(s.storyId), s]));

  res.json({
    stories: stories.map((s) => ({
      _id: s._id,
      title: s.title,
      level: s.level,
      topics: s.topics,
      createdAt: s.createdAt,
      sessionId: sessionByStory.get(String(s._id))?._id,
      sessionStatus: sessionByStory.get(String(s._id))?.status,
    })),
  });
});

router.get("/:id", authMiddleware, async (req, res) => {
  const story = await Story.findOne({ _id: req.params.id, userId: req.user.googleId });
  if (!story) return res.status(404).json({ error: "Story not found" });

  const session = await ReadingSession.findOne({
    storyId: story._id,
    userId: req.user.googleId,
  }).sort({ startedAt: -1 });

  res.json({ story, sessionId: session?._id, sessionStatus: session?.status });
});

module.exports = router;
