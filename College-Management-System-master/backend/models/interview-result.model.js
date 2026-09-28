const mongoose = require("mongoose");

const answerAnalysisSchema = new mongoose.Schema(
  {
    grammar: { type: Number, required: true, min: 0, max: 100 },
    relevance: { type: Number, required: true, min: 0, max: 100 },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    score: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, required: true },
    tips: { type: [String], default: [] },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    analysis: { type: answerAnalysisSchema, required: true },
  },
  { _id: false }
);

const interviewResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, required: true },
    improvementTips: { type: [String], default: [] },
    behaviorMetrics: {
      faceDetectedRatio: { type: Number, min: 0, max: 1, default: 0 },
      tabSwitchCount: { type: Number, min: 0, default: 0 },
      speechSegments: { type: Number, min: 0, default: 0 },
      avgAnswerDurationSec: { type: Number, min: 0, default: 0 },
      warnings: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewResult", interviewResultSchema);
