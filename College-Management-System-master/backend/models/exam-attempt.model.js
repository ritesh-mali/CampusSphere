const mongoose = require("mongoose");

const examAttemptAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
      index: true,
    },
    answers: { type: [examAttemptAnswerSchema], default: [] },
    score: { type: Number, required: true, min: 0, default: 0 },
    totalMarks: { type: Number, required: true, min: 0, default: 0 },
    submittedAt: { type: Date, required: true, default: Date.now },
    violations: {
      tabSwitchCount: { type: Number, default: 0, min: 0 },
      blurCount: { type: Number, default: 0, min: 0 },
      fullscreenExitCount: { type: Number, default: 0, min: 0 },
      copyCount: { type: Number, default: 0, min: 0 },
      pasteCount: { type: Number, default: 0, min: 0 },
      rightClickCount: { type: Number, default: 0, min: 0 },
    },
    isAutoSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

examAttemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("ExamAttempt", examAttemptSchema);

