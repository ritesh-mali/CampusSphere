const express = require("express");
const auth = require("../middlewares/auth.middleware");
const adminOnly = require("../middlewares/adminOnly.middleware");
const {
  listCompanies,
  getCompany,
  getQuizQuestions,
  submitQuiz,
  myAttempts,
  adminUpsertCompany,
  adminUpsertQuestion,
  adminListQuestions,
} = require("../controllers/campussphere/placement.controller");

const router = express.Router();

router.get("/companies", auth, listCompanies);
router.get("/companies/:id", auth, getCompany);
router.get("/companies/:id/questions/:section", auth, getQuizQuestions);
router.post("/companies/:id/submit", auth, submitQuiz);
router.get("/my-attempts", auth, myAttempts);

router.post("/admin/companies", auth, adminOnly, adminUpsertCompany);
router.post("/admin/questions", auth, adminOnly, adminUpsertQuestion);
router.get("/admin/questions", auth, adminOnly, adminListQuestions);

module.exports = router;
