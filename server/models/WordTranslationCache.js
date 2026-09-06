const mongoose = require("mongoose");

const wordTranslationCacheSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  translation: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WordTranslationCache", wordTranslationCacheSchema);
