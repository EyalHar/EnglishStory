const express = require("express");
const HardWord = require("../models/HardWord");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/hard", authMiddleware, async (req, res) => {
  const words = await HardWord.find({ userId: req.user.googleId, status: "active" }).sort({
    timesMarkedHard: -1,
    lastMarkedAt: -1,
  });
  res.json({ words });
});

router.get("/graduated", authMiddleware, async (req, res) => {
  const words = await HardWord.find({ userId: req.user.googleId, status: "graduated" }).sort({
    graduatedAt: -1,
  });
  res.json({ words });
});

module.exports = router;
