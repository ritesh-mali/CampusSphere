const express = require("express");
const auth = require("../middlewares/auth.middleware");
const {
  markAttendanceController,
  getAttendanceStudentsController,
  getMyAttendanceController,
} = require("../controllers/attendance.controller");

const router = express.Router();

router.post("/mark", auth, markAttendanceController);
router.get("/students", auth, getAttendanceStudentsController);
router.get("/my", auth, getMyAttendanceController);

module.exports = router;
