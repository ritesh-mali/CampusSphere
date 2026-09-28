const mongoose = require("mongoose");

const feedbackQuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: ["rating", "text"], required: true },
  },
  { _id: false }
);

const feedbackFormSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FacultyDetail",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    semester: { type: Number, default: null },
    targetSemesters: {
      type: [Number],
      default: [],
    },
    questions: { type: [feedbackQuestionSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeedbackForm", feedbackFormSchema);
