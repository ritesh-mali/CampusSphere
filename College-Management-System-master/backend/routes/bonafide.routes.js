const express = require("express");
const auth = require("../middlewares/auth.middleware");
const {
  getBonafideConfigController,
  createBonafideOrderController,
  verifyBonafidePaymentController,
  getMyBonafideRequestsController,
} = require("../controllers/bonafide.controller");

const router = express.Router();

router.get("/config", auth, getBonafideConfigController);
router.post("/create-order", auth, createBonafideOrderController);
router.post("/verify-payment", auth, verifyBonafidePaymentController);
router.get("/my", auth, getMyBonafideRequestsController);

module.exports = router;
