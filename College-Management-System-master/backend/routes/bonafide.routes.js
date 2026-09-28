const express = require("express");
const auth = require("../middlewares/auth.middleware");
const adminOnly = require("../middlewares/adminOnly.middleware");
const {
  getBonafideConfigController,
  createBonafideOrderController,
  verifyBonafidePaymentController,
  getMyBonafideRequestsController,
  getAllBonafideRequestsController,
  updateBonafideStatusController,
} = require("../controllers/bonafide.controller");

const router = express.Router();

router.get("/config", auth, getBonafideConfigController);
router.post("/create-order", auth, createBonafideOrderController);
router.post("/verify-payment", auth, verifyBonafidePaymentController);
router.get("/my", auth, getMyBonafideRequestsController);

// Admin routes
router.get("/all", auth, adminOnly, getAllBonafideRequestsController);
router.patch("/:id/status", auth, adminOnly, updateBonafideStatusController);

module.exports = router;
