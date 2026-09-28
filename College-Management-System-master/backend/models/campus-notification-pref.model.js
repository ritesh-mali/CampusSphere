const mongoose = require("mongoose");

const campusNotificationPrefSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    emailEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CampusNotificationPref", campusNotificationPrefSchema);
