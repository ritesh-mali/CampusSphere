const express = require("express");
const auth = require("../middlewares/auth.middleware");
const {
  createFeedbackFormController,
  getFeedbackFormsController,
  submitFeedbackController,
  getFeedbackAnalyticsController,
} = require("../controllers/feedback.controller");

const router = express.Router();

router.post("/create", auth, createFeedbackFormController);
router.get("/forms", auth, getFeedbackFormsController);
router.post("/submit", auth, submitFeedbackController);
router.get("/analytics", auth, getFeedbackAnalyticsController);

module.exports = router;
