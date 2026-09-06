const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },

  level: {
    score: Number,
    cefr: String,
  },

  topics: [String],

  targetWords: [
    {
      word: String,
      source: { type: String, enum: ["hard", "review", "translated", "new"] },
      note: String,
    },
  ],

  expressions: [
    {
      words: [String],
    },
  ],

  generationParams: mongoose.Schema.Types.Mixed,

  createdAt: { type: Date, default: Date.now },
});

storySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Story", storySchema);
