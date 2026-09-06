const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  picture: { type: String },

  onboarding: {
    completed: { type: Boolean, default: false },
    selfReportedLevel: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    placementTestId: { type: mongoose.Schema.Types.ObjectId, ref: "PlacementTestResult" },
  },

  level: {
    score: { type: Number, default: 20, min: 0, max: 100 },
    cefr: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], default: "A1" },
    updatedAt: { type: Date, default: Date.now },
    history: [
      {
        score: Number,
        cefr: String,
        date: { type: Date, default: Date.now },
        reason: String,
      },
    ],
  },

  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastStoryDate: { type: Date },
  },

  stats: {
    storiesCompleted: { type: Number, default: 0 },
    wordsMastered: { type: Number, default: 0 },
    totalWordsTranslated: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
