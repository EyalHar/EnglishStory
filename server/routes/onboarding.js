const express = require("express");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const PlacementTestResult = require("../models/PlacementTestResult");
const { authMiddleware } = require("../middleware/auth");
const { scoreToCefr, clampScore, SELF_REPORT_SEED } = require("../services/levelModel");

const router = express.Router();

const placementWords = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/placementWords.json"), "utf-8")
);
const placementWordsByWord = new Map(placementWords.map((w) => [w.word, w]));

function shuffledWordList() {
  const words = placementWords.map((w) => w.word);
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words;
}

router.get("/status", authMiddleware, async (req, res) => {
  const user = await User.findOne({ googleId: req.user.googleId });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    completed: user.onboarding.completed,
    selfReportedLevel: user.onboarding.selfReportedLevel,
    level: user.level,
  });
});

router.post("/self-report", authMiddleware, async (req, res) => {
  const { level } = req.body;
  if (!SELF_REPORT_SEED[level]) return res.status(400).json({ error: "Invalid level" });

  const user = await User.findOne({ googleId: req.user.googleId });
  if (!user) return res.status(404).json({ error: "User not found" });

  user.onboarding.selfReportedLevel = level;
  user.level.score = SELF_REPORT_SEED[level];
  user.level.cefr = scoreToCefr(user.level.score);
  await user.save();

  res.json({ words: shuffledWordList() });
});

router.get("/placement-test", authMiddleware, (req, res) => {
  res.json({ words: shuffledWordList() });
});

router.post("/placement-test/submit", authMiddleware, async (req, res) => {
  const { responses } = req.body;
  if (!Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: "Missing responses" });
  }

  const items = responses
    .filter((r) => placementWordsByWord.has(r.word))
    .map((r) => ({
      word: r.word,
      presentedLevel: placementWordsByWord.get(r.word).presentedLevel,
      known: !!r.known,
    }));

  const user = await User.findOne({ googleId: req.user.googleId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const knownItems = items.filter((i) => i.known);
  const fallback = SELF_REPORT_SEED[user.onboarding.selfReportedLevel] ?? 20;
  const estimatedLevelScore = knownItems.length
    ? clampScore(knownItems.reduce((sum, i) => sum + i.presentedLevel, 0) / knownItems.length)
    : clampScore(fallback - 10);
  const estimatedCefr = scoreToCefr(estimatedLevelScore);

  const result = await PlacementTestResult.create({
    userId: user.googleId,
    selfReportedLevel: user.onboarding.selfReportedLevel,
    items,
    estimatedLevelScore,
    estimatedCefr,
  });

  user.level.score = estimatedLevelScore;
  user.level.cefr = estimatedCefr;
  user.level.history.push({ score: estimatedLevelScore, cefr: estimatedCefr, reason: "placement test" });
  user.onboarding.completed = true;
  user.onboarding.placementTestId = result._id;
  await user.save();

  res.json({ level: user.level, resultId: result._id });
});

module.exports = router;
