const crypto = require("crypto");
const Razorpay = require("razorpay");
const ApiResponse = require("../utils/ApiResponse");
const BonafideRequest = require("../models/bonafide-request.model");
const StudentDetail = require("../models/details/student-details.model");

const BONAFIDE_AMOUNT_RUPEES = 10;
const BONAFIDE_AMOUNT_PAISE = BONAFIDE_AMOUNT_RUPEES * 100;

const getRazorpayInstance = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  });

const getBonafideConfigController = async (req, res) => {
  return ApiResponse.success(
    { keyId: process.env.RAZORPAY_KEY_ID || "", amount: BONAFIDE_AMOUNT_RUPEES },
    "Bonafide payment config fetched"
  ).send(res);
};

const createBonafideOrderController = async (req, res) => {
  try {
    const student = await StudentDetail.findById(req.userId).lean();
    if (!student) {
      return ApiResponse.forbidden("Only students can request bonafide").send(res);
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return ApiResponse.internalServerError(
        "Razorpay keys are not configured on server"
      ).send(res);
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: BONAFIDE_AMOUNT_PAISE,
      currency: "INR",
      receipt: `bonafide_${Date.now()}`,
      notes: { studentId: String(req.userId) },
    });

    return ApiResponse.success(
      {
        orderId: order.id,
        amount: BONAFIDE_AMOUNT_RUPEES,
        amountPaise: BONAFIDE_AMOUNT_PAISE,
        currency: "INR",
      },
      "Bonafide payment order created"
    ).send(res);
  } catch (error) {
    console.error("Create Bonafide Order Error:", error);
    return ApiResponse.internalServerError(
      "Failed to create bonafide payment order"
    ).send(res);
  }
};

const verifyBonafidePaymentController = async (req, res) => {
  try {
    const student = await StudentDetail.findById(req.userId).lean();
    if (!student) {
      return ApiResponse.forbidden("Only students can request bonafide").send(res);
    }

    const {
      fullName,
      rollNumber,
      year,
      semester,
      reason,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !fullName ||
      !rollNumber ||
      !year ||
      !semester ||
      !reason ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return ApiResponse.badRequest("Missing payment verification details").send(
        res
      );
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return ApiResponse.badRequest("Invalid Razorpay signature").send(res);
    }

    const saved = await BonafideRequest.create({
      studentId: req.userId,
      fullName: String(fullName).trim(),
      rollNumber: String(rollNumber).trim(),
      year: String(year).trim(),
      semester: Number(semester),
      reason: String(reason).trim(),
      amount: BONAFIDE_AMOUNT_RUPEES,
      paymentStatus: "paid",
      requestStatus: "pending",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return ApiResponse.created(saved, "Bonafide request created successfully").send(
      res
    );
  } catch (error) {
    console.error("Verify Bonafide Payment Error:", error);
    return ApiResponse.internalServerError(
      "Failed to verify bonafide payment"
    ).send(res);
  }
};

const getMyBonafideRequestsController = async (req, res) => {
  try {
    const requests = await BonafideRequest.find({ studentId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    return ApiResponse.success(requests, "Bonafide requests fetched").send(res);
  } catch (error) {
    console.error("Get Bonafide Requests Error:", error);
    return ApiResponse.internalServerError(
      "Failed to fetch bonafide requests"
    ).send(res);
  }
};

module.exports = {
  getBonafideConfigController,
  createBonafideOrderController,
  verifyBonafidePaymentController,
  getMyBonafideRequestsController,
};
