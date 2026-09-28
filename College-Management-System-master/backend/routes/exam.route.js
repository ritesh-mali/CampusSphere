const express = require("express");
const {
  getAssignedWeeklyExamsController,
  getFacultyWeeklyExamsController,
  createWeeklyExamController,
  addMcqQuestionController,
  publishWeeklyExamController,
  getWeeklyExamForStudentController,
  submitWeeklyExamController,
  getWeeklyExamResultsForFacultyController,
  deleteWeeklyExamController,
} = require("../controllers/exam.controller");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

// Student
router.get("/assigned", auth, getAssignedWeeklyExamsController);
router.get("/:id", auth, getWeeklyExamForStudentController);
router.post("/:id/submit", auth, submitWeeklyExamController);

// Faculty
router.get("/", auth, getFacultyWeeklyExamsController);
router.post("/", auth, upload.any(), createWeeklyExamController);
router.post("/:id/questions", auth, upload.any(), addMcqQuestionController);
router.patch("/:id/publish", auth, publishWeeklyExamController);
router.get("/:id/results", auth, getWeeklyExamResultsForFacultyController);
router.delete("/:id", auth, deleteWeeklyExamController);

module.exports = router;
