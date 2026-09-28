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
      const orderId = `order_dummy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return ApiResponse.success(
        {
          orderId,
          amount: BONAFIDE_AMOUNT_RUPEES,
          amountPaise: BONAFIDE_AMOUNT_PAISE,
          currency: "INR",
          isMock: true,
        },
        "Bonafide payment order created (Mock Mode)"
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
      !reason
    ) {
      return ApiResponse.badRequest("Missing required bonafide request details").send(
        res
      );
    }

    // Verify payment only if razorpay parameters are passed
    if (razorpay_order_id || razorpay_payment_id || razorpay_signature) {
      let paymentVerified = false;
      const orderIdStr = razorpay_order_id || "";
      if (orderIdStr.startsWith("order_dummy_")) {
        paymentVerified = true;
      } else {
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
          .update(body.toString())
          .digest("hex");

        if (expectedSignature === razorpay_signature) {
          paymentVerified = true;
        }
      }

      if (!paymentVerified) {
        return ApiResponse.badRequest("Invalid Razorpay signature").send(res);
      }
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
      requestStatus: "Pending",
      razorpayOrderId: razorpay_order_id || `order_direct_${Date.now()}`,
      razorpayPaymentId: razorpay_payment_id || `pay_direct_${Date.now()}`,
      razorpaySignature: razorpay_signature || `sig_direct_${Date.now()}`,
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

const getAllBonafideRequestsController = async (req, res) => {
  try {
    const requests = await BonafideRequest.find()
      .sort({ createdAt: -1 })
      .lean();
    return ApiResponse.success(requests, "All bonafide requests fetched").send(res);
  } catch (error) {
    console.error("Get All Bonafide Requests Error:", error);
    return ApiResponse.internalServerError(
      "Failed to fetch all bonafide requests"
    ).send(res);
  }
};

const updateBonafideStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestStatus } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(requestStatus)) {
      return ApiResponse.badRequest("Invalid request status").send(res);
    }

    const updated = await BonafideRequest.findByIdAndUpdate(
      id,
      { requestStatus },
      { new: true }
    );

    if (!updated) {
      return ApiResponse.notFound("Bonafide request not found").send(res);
    }

    return ApiResponse.success(updated, `Request successfully ${requestStatus}`).send(res);
  } catch (error) {
    console.error("Update Bonafide Status Error:", error);
    return ApiResponse.internalServerError(
      "Failed to update bonafide request status"
    ).send(res);
  }
};

module.exports = {
  getBonafideConfigController,
  createBonafideOrderController,
  verifyBonafidePaymentController,
  getMyBonafideRequestsController,
  getAllBonafideRequestsController,
  updateBonafideStatusController,
};
