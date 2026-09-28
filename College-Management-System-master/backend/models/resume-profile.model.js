const mongoose = require("mongoose");

const resumeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
      index: true,
    },
    fileName: { type: String, default: "" },
    filePath: { type: String, default: "" },
    rawText: { type: String, default: "" },
    parsed: {
      name: { type: String, default: "" },
      skills: { type: [String], default: [] },
      technologies: { type: [String], default: [] },
      projects: { type: [String], default: [] },
      experience: { type: [String], default: [] },
      education: { type: [String], default: [] },
      certifications: { type: [String], default: [] },
    },
    aiSummary: { type: String, default: "" },
    atsScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeProfile", resumeProfileSchema);
