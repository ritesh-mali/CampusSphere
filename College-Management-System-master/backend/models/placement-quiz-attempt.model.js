const mongoose = require("mongoose");

const placementQuizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementCompany",
      required: true,
    },
    section: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    durationSeconds: { type: Number, default: null },
    detail: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlacementQuizAttempt", placementQuizAttemptSchema);
