const mongoose = require("mongoose");

const hardWordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  word: { type: String, required: true },
  language: { type: String, default: "en" },

  timesMarkedHard: { type: Number, default: 1 },
  status: { type: String, enum: ["active", "graduated"], default: "active" },

  firstMarkedAt: { type: Date, default: Date.now },
  lastMarkedAt: { type: Date, default: Date.now },
  graduatedAt: { type: Date },

  metadata: {
    length: Number,
    syllableCount: Number,
    lengthBucket: { type: String, enum: ["short", "medium", "long"] },
    letterPatterns: [String],
    topics: [String],
  },

  spacedRepetition: {
    boxLevel: { type: Number, default: 1, min: 1, max: 4 },
    dueAtStoryIndex: { type: Number, default: 0 },
    lastReviewedAtStory: Number,
    reviewCount: { type: Number, default: 0 },
  },
});

hardWordSchema.index({ userId: 1, word: 1 }, { unique: true });
hardWordSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("HardWord", hardWordSchema);
