const mongoose = require("mongoose");

const scoreBlockSchema = new mongoose.Schema(
  {
    overall: { type: Number, min: 0, max: 100, default: 0 },
    technical: { type: Number, min: 0, max: 100, default: 0 },
    communication: { type: Number, min: 0, max: 100, default: 0 },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    grammar: { type: Number, min: 0, max: 100, default: 0 },
    fluency: { type: Number, min: 0, max: 100, default: 0 },
    relevance: { type: Number, min: 0, max: 100, default: 0 },
    problemSolving: { type: Number, min: 0, max: 100, default: 0 },
    keywordMatch: { type: Number, min: 0, max: 100, default: 0 },
    professionalism: { type: Number, min: 0, max: 100, default: 0 },
    atsCompatibility: { type: Number, min: 0, max: 100, default: 0 },
    interviewReadiness: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const emotionMetricsSchema = new mongoose.Schema(
  {
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    nervousness: { type: Number, min: 0, max: 100, default: 0 },
    eyeContact: { type: Number, min: 0, max: 100, default: 0 },
    attention: { type: Number, min: 0, max: 100, default: 0 },
    dominantExpression: { type: String, default: "neutral" },
    behavioralSummary: { type: String, default: "" },
  },
  { _id: false }
);

const answerDetailSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
    analysis: {
      score: Number,
      feedback: String,
      grammar: Number,
      relevance: Number,
      confidence: Number,
      fillerWords: Number,
      speakingPace: String,
      keywordsMatched: [String],
    },
  },
  { _id: false }
);

const mockInterviewResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockInterviewSession",
      required: true,
      index: true,
    },
    role: { type: String, index: true },
    scores: { type: scoreBlockSchema, default: () => ({}) },
    emotionMetrics: { type: emotionMetricsSchema, default: () => ({}) },
    behaviorMetrics: {
      faceDetectedRatio: { type: Number, default: 0 },
      tabSwitchCount: { type: Number, default: 0 },
      speechSegments: { type: Number, default: 0 },
      avgAnswerDurationSec: { type: Number, default: 0 },
      warnings: { type: [String], default: [] },
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    improvementSuggestions: { type: [String], default: [] },
    missingConcepts: { type: [String], default: [] },
    learningResources: { type: [String], default: [] },
    improvementRoadmap: { type: [String], default: [] },
    overallFeedback: { type: String, default: "" },
    answers: { type: [answerDetailSchema], default: [] },
    chartData: {
      labels: [String],
      technical: [Number],
      communication: [Number],
    },
    aiUsageTokensEstimate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MockInterviewResult",
  mockInterviewResultSchema
);
