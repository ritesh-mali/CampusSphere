const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const auth = require("../middlewares/auth.middleware");
const ApiResponse = require("../utils/ApiResponse");
const {
  uploadResumeController,
  getLatestResumeController,
  getRolesController,
  startMockInterviewController,
  submitAnswerController,
  completeInterviewController,
  getHistoryController,
  getResultController,
  downloadReportPdfController,
} = require("../controllers/mock-interview.controller");

const uploadDir = path.join(__dirname, "..", "media", "resume_uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(
      null,
      `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    );
  },
});

const allowedMime = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const resumeFilter = (_req, file, cb) => {
  if (!allowedMime.has(file.mimetype)) {
    return cb(new Error("Only PDF and DOCX files are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: resumeFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.get("/roles", auth, getRolesController);
router.get("/resume/latest", auth, getLatestResumeController);
router.post("/resume/upload", auth, (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      return ApiResponse.badRequest(err.message || "Invalid upload").send(res);
    }
    uploadResumeController(req, res);
  });
});

router.post("/start", auth, startMockInterviewController);
router.post("/answer", auth, submitAnswerController);
router.post("/complete", auth, completeInterviewController);
router.get("/history", auth, getHistoryController);
router.get("/result/:resultId", auth, getResultController);
router.get("/result/:resultId/pdf", auth, downloadReportPdfController);

module.exports = router;
