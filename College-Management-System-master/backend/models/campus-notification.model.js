const mongoose = require("mongoose");

const campusNotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    message: { type: String, required: true, maxlength: 512 },
    type: { type: String, required: true },
    status: { type: String, enum: ["unread", "read"], default: "unread" },
  },
  { timestamps: true }
);

campusNotificationSchema.index({ userId: 1, status: 1 });
campusNotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("CampusNotification", campusNotificationSchema);
