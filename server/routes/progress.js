const express = require("express");
const User = require("../models/User");
const HardWord = require("../models/HardWord");
const DifficultyPatternProfile = require("../models/DifficultyPatternProfile");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", authMiddleware, async (req, res) => {
  const user = await User.findOne({ googleId: req.user.googleId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const activeHardWordCount = await HardWord.countDocuments({
    userId: user.googleId,
    status: "active",
  });

  res.json({
    level: user.level,
    streak: user.streak,
    stats: user.stats,
    activeHardWordCount,
  });
});

router.get("/pattern-profile", authMiddleware, async (req, res) => {
  const profile = await DifficultyPatternProfile.findOne({ userId: req.user.googleId });
  res.json({ profile });
});

module.exports = router;
