const express = require("express");
const auth = require("../middlewares/auth.middleware");
const {
  startInterviewController,
  submitInterviewController,
} = require("../controllers/interview.controller");

const router = express.Router();

router.post("/start", auth, startInterviewController);
router.post("/submit", auth, submitInterviewController);

module.exports = router;
