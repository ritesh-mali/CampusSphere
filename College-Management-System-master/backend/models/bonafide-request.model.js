const mongoose = require("mongoose");

const bonafideRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    reason: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 10 },
    paymentStatus: {
      type: String,
      enum: ["paid", "failed"],
      default: "paid",
    },
    requestStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    razorpaySignature: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BonafideRequest", bonafideRequestSchema);
