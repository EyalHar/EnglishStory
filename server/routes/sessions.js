const express = require("express");
const ReadingSession = require("../models/ReadingSession");
const TranslatedWord = require("../models/TranslatedWord");
const HardWord = require("../models/HardWord");
const Story = require("../models/Story");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const { translateToHebrew } = require("../services/translation");
const { buildWordMetadata } = require("../services/wordFeatures");
const { countUniqueWords } = require("../services/storyGeneration");
const { adjustLevelAfterSession } = require("../services/levelModel");
const { buildFeedbackMessage } = require("../services/feedback");

const router = express.Router();

router.post("/:sessionId/translate", authMiddleware, async (req, res) => {
  const { word, context } = req.body;
  if (!word) return res.status(400).json({ error: "Missing word" });
  const normalizedWord = word.trim().toLowerCase();

  const session = await ReadingSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.googleId,
  });
  if (!session) return res.status(404).json({ error: "Session not found" });

  try {
    const { phrase, translation } = await translateToHebrew(normalizedWord, context);
    const normalizedPhrase = (phrase || normalizedWord).trim().toLowerCase();

    const interaction = session.interactions.find((i) => i.word === normalizedPhrase);
    if (interaction) interaction.translated = true;
    else session.interactions.push({ word: normalizedPhrase, translated: true });
    await session.save();

    await TranslatedWord.create({
      userId: req.user.googleId,
      word: normalizedPhrase,
      storyId: session.storyId,
      sessionId: session._id,
      translation,
    });

    await User.updateOne({ googleId: req.user.googleId }, { $inc: { "stats.totalWordsTranslated": 1 } });

    res.json({ word: normalizedWord, phrase: normalizedPhrase, translation });
  } catch (err) {
    console.log("TRANSLATE ERROR:", err.message);
    res.status(500).json({ error: "Failed to translate word" });
  }
});

router.post("/:sessionId/mark-hard", authMiddleware, async (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: "Missing word" });
  const normalized = word.trim().toLowerCase();

  const session = await ReadingSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.googleId,
  });
  if (!session) return res.status(404).json({ error: "Session not found" });

  try {
    const hardWord = await HardWord.findOneAndUpdate(
      { userId: req.user.googleId, word: normalized },
      {
        $inc: { timesMarkedHard: 1 },
        $set: { lastMarkedAt: new Date(), status: "active" },
        $setOnInsert: { firstMarkedAt: new Date(), metadata: buildWordMetadata(normalized) },
      },
      { upsert: true, new: true }
    );

    const interaction = session.interactions.find((i) => i.word === normalized);
    if (interaction) interaction.markedHard = true;
    else session.interactions.push({ word: normalized, markedHard: true });
    await session.save();

    res.json({ word: normalized, timesMarkedHard: hardWord.timesMarkedHard, status: hardWord.status });
  } catch (err) {
    console.log("MARK HARD ERROR:", err.message);
    res.status(500).json({ error: "Failed to mark word as hard" });
  }
});

router.post("/:sessionId/unmark-hard", authMiddleware, async (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: "Missing word" });
  const normalized = word.trim().toLowerCase();

  const session = await ReadingSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.googleId,
  });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const interaction = session.interactions.find((i) => i.word === normalized);
  if (interaction) interaction.markedHard = false;
  await session.save();

  res.json({ ok: true });
});

router.post("/:sessionId/complete", authMiddleware, async (req, res) => {
  const session = await ReadingSession.findOne({
    _id: req.params.sessionId,
    userId: req.user.googleId,
  });
  if (!session) return res.status(404).json({ error: "Session not found" });

  if (session.status === "completed") {
    return res.json({ alreadyCompleted: true, summary: session.summary });
  }

  try {
    const story = await Story.findById(session.storyId);
    const user = await User.findOne({ googleId: req.user.googleId });

    const totalUniqueWords = countUniqueWords(story.body);
    const struggledWords = new Set(
      session.interactions.filter((i) => i.translated || i.markedHard).map((i) => i.word)
    );
    const strugglingWords = struggledWords.size;
    const hardWordDensity = totalUniqueWords ? strugglingWords / totalUniqueWords : 0;

    const activeHardWordCount = await HardWord.countDocuments({
      userId: user.googleId,
      status: "active",
    });
    const levelBefore = user.level.score;
    const { newScore, cefr, reason } = adjustLevelAfterSession({
      currentScore: levelBefore,
      hardWordDensity,
      activeHardWordCount,
    });

    // Graduate hard words that appeared in this story but weren't struggled with this time.
    const activeHardWords = await HardWord.find({ userId: user.googleId, status: "active" });
    const bodyLower = story.body.toLowerCase();
    const newlyGraduatedWords = [];
    for (const hw of activeHardWords) {
      const firstWord = hw.word.split(" ")[0];
      const appears = new RegExp(`\\b${firstWord}\\b`, "i").test(bodyLower);
      if (appears && !struggledWords.has(hw.word)) {
        hw.status = "graduated";
        hw.graduatedAt = new Date();
        await hw.save();
        newlyGraduatedWords.push(hw.word);
      }
    }

    // Streak: bump if the last completed story was yesterday, reset to 1 otherwise (unless already today).
    const today = new Date();
    const lastDate = user.streak.lastStoryDate;
    const isSameDay = lastDate && lastDate.toDateString() === today.toDateString();
    const daysSinceLast = lastDate ? (today - lastDate) / (1000 * 60 * 60 * 24) : null;
    const isYesterday = daysSinceLast !== null && daysSinceLast >= 0.5 && daysSinceLast < 1.5;

    if (!isSameDay) {
      user.streak.current = isYesterday ? user.streak.current + 1 : 1;
      user.streak.longest = Math.max(user.streak.longest, user.streak.current);
      user.streak.lastStoryDate = today;
    }

    user.level.score = newScore;
    user.level.cefr = cefr;
    user.level.history.push({ score: newScore, cefr, date: new Date(), reason });
    user.level.history = user.level.history.slice(-50);
    user.stats.storiesCompleted += 1;
    user.stats.wordsMastered += newlyGraduatedWords.length;
    await user.save();

    const summary = {
      totalUniqueWords,
      strugglingWords,
      hardWordDensity,
      levelBefore,
      levelAfter: newScore,
      adjustmentReason: reason,
      newlyGraduatedWords,
    };

    session.status = "completed";
    session.completedAt = new Date();
    session.summary = summary;
    await session.save();

    const feedbackMessage = buildFeedbackMessage({
      levelBefore,
      levelAfter: newScore,
      cefr,
      newlyGraduatedWords,
      streak: user.streak,
    });

    res.json({
      summary,
      levelBefore,
      levelAfter: newScore,
      newlyGraduatedWords,
      streak: user.streak,
      feedbackMessage,
    });
  } catch (err) {
    console.log("SESSION COMPLETE ERROR:", err.message);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

module.exports = router;
