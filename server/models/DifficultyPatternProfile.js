const mongoose = require("mongoose");

const difficultyPatternProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },

  lengthBuckets: {
    short: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    long: { type: Number, default: 0 },
  },
  avgWordLength: Number,
  avgSyllableCount: Number,

  commonNGrams: [{ ngram: String, count: Number }],
  weakTopics: [{ topic: String, count: Number }],

  sampleSize: Number,
  lastComputedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DifficultyPatternProfile", difficultyPatternProfileSchema);
