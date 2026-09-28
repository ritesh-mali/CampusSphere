const mongoose = require("mongoose");

const responseItemSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    type: { type: String, enum: ["rating", "text"], required: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    text: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const feedbackResponseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedbackForm",
      required: true,
      index: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FacultyDetail",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
      index: true,
    },
    responses: { type: [responseItemSchema], default: [] },
  },
  { timestamps: true }
);

feedbackResponseSchema.index({ formId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("FeedbackResponse", feedbackResponseSchema);
