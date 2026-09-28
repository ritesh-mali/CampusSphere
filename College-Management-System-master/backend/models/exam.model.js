const mongoose = require("mongoose");

const examQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "At least 2 options are required",
      },
      required: true,
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    marks: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    // Weekly exam meta
    title: { type: String, required: true, trim: true },
    weekStartDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1, default: 30 },

    // Target audience ("batch + semester" in your app maps to branchId + semester)
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    semester: { type: Number, required: true, min: 1, max: 8 },

    createdByFacultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FacultyDetail",
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    questions: { type: [examQuestionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
