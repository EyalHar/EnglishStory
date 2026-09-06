const mongoose = require("mongoose");

const readingSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story", required: true },

  status: { type: String, enum: ["active", "completed", "abandoned"], default: "active" },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },

  interactions: [
    {
      word: String,
      translated: { type: Boolean, default: false },
      markedHard: { type: Boolean, default: false },
      firstEventAt: { type: Date, default: Date.now },
    },
  ],

  summary: {
    totalUniqueWords: Number,
    strugglingWords: Number,
    hardWordDensity: Number,
    levelBefore: Number,
    levelAfter: Number,
    adjustmentReason: String,
    newlyGraduatedWords: [String],
    relapsedWords: [String],
  },
});

readingSessionSchema.index({ userId: 1, storyId: 1 });

module.exports = mongoose.model("ReadingSession", readingSessionSchema);
