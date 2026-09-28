const mongoose = require("mongoose");

const campusEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    eventDatetime: { type: Date, required: true, index: true },
    location: { type: String, required: true },
    createdBy: { type: String, required: true },
    creatorRole: { type: String, enum: ["admin", "faculty"], default: "faculty" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CampusEvent", campusEventSchema);
