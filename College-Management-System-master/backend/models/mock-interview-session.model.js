const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "technical",
        "hr",
        "project",
        "problem-solving",
        "behavioral",
        "scenario",
      ],
      default: "technical",
    },
    difficulty: { type: Number, min: 1, max: 5, default: 1 },
  },
  { _id: false }
);

const mockInterviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
      index: true,
    },
    resumeProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeProfile",
    },
    role: { type: String, required: true, index: true },
    roleLabel: { type: String, default: "" },
    experienceLevel: {
      type: String,
      enum: ["fresher", "junior", "mid", "senior"],
      default: "fresher",
    },
    questions: { type: [questionSchema], default: [] },
    currentIndex: { type: Number, default: 0 },
    answers: [
      {
        question: String,
        answer: String,
        durationSec: Number,
        skipped: { type: Boolean, default: false },
        retried: { type: Boolean, default: false },
      },
    ],
    questionHistory: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["setup", "active", "completed", "abandoned"],
      default: "setup",
    },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MockInterviewSession",
  mockInterviewSessionSchema
);
