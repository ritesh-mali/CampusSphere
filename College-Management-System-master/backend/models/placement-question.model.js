const mongoose = require("mongoose");

const placementQuestionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementCompany",
      required: true,
      index: true,
    },
    section: {
      type: String,
      enum: ["aptitude", "technical", "hr"],
      required: true,
    },
    questionText: { type: String, required: true },
    options: {
      type: [String],
      validate: [(arr) => arr.length >= 2, "At least 2 options"],
      required: true,
    },
    correctIndex: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

placementQuestionSchema.index({ companyId: 1, section: 1 });

module.exports = mongoose.model("PlacementQuestion", placementQuestionSchema);
