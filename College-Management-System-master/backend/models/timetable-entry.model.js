const mongoose = require("mongoose");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CLASS_YEARS = ["FY", "SY", "TY", "BE"];

const timetableEntrySchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    faculty: { type: String, required: true, trim: true },
    day: { type: String, required: true, enum: DAYS },
    start_time: { type: String, required: true }, // "HH:MM"
    end_time: { type: String, required: true }, // "HH:MM"
    class_year: { type: String, required: true, enum: CLASS_YEARS },
    department: { type: String, required: true, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdRole: { type: String, enum: ["admin", "faculty"], required: true },
  },
  { timestamps: true }
);

timetableEntrySchema.index({
  department: 1,
  class_year: 1,
  day: 1,
  start_time: 1,
  end_time: 1,
});

module.exports = mongoose.model("TimetableEntry", timetableEntrySchema);

