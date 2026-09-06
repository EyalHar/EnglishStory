const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { JWT_SECRET, authMiddleware } = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Missing credential" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ googleId });
    const isNew = !user;
    if (isNew) {
      user = await User.create({ googleId, email, name, picture });
    }

    const token = jwt.sign({ googleId, email, name, picture }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user, isNew });
  } catch (err) {
    console.log("AUTH ERROR:", err.message);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findOne({ googleId: req.user.googleId });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

module.exports = router;
