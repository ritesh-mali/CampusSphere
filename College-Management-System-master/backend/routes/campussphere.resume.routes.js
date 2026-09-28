const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const auth = require("../middlewares/auth.middleware");
const ApiResponse = require("../utils/ApiResponse");
const { analyzeResumeController } = require("../controllers/campussphere/resume.controller");

const uploadDir = path.join(__dirname, "..", "media", "resume_uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
  },
});

const pdfOnly = (_req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF files are allowed"));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter: pdfOnly, limits: { fileSize: 8 * 1024 * 1024 } });

const router = express.Router();

router.post("/analyze", auth, (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      return ApiResponse.badRequest(err.message || "Invalid upload").send(res);
    }
    analyzeResumeController(req, res);
  });
});

module.exports = router;
