const mongoose = require("mongoose");

const campusEventRegistrationSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CampusEvent",
      required: true,
    },
  },
  { timestamps: true }
);

campusEventRegistrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });
campusEventRegistrationSchema.index({ eventId: 1 });

module.exports = mongoose.model("CampusEventRegistration", campusEventRegistrationSchema);
