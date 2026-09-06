const mongoose = require("mongoose");

const placementTestResultSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  selfReportedLevel: { type: String, enum: ["beginner", "intermediate", "advanced"] },
  items: [
    {
      word: String,
      presentedLevel: Number,
      known: Boolean,
    },
  ],
  estimatedLevelScore: Number,
  estimatedCefr: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PlacementTestResult", placementTestResultSchema);
