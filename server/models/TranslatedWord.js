const mongoose = require("mongoose");

const translatedWordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  word: { type: String, required: true },
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ReadingSession" },
  translation: { type: String },
  timestamp: { type: Date, default: Date.now },
});

translatedWordSchema.index({ userId: 1, word: 1, timestamp: -1 });

module.exports = mongoose.model("TranslatedWord", translatedWordSchema);
