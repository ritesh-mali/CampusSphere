const mongoose = require("mongoose");

const interviewCategorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    category: { type: String, default: "engineering" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewCategory", interviewCategorySchema);
