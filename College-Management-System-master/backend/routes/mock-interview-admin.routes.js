const express = require("express");
const auth = require("../middlewares/auth.middleware");
const adminOnly = require("../middlewares/adminOnly.middleware");
const {
  getAnalyticsController,
  getUsersController,
  getReportsController,
  getCategoriesController,
  updateCategoryController,
} = require("../controllers/mock-interview-admin.controller");

const router = express.Router();

router.use(auth, adminOnly);

router.get("/analytics", getAnalyticsController);
router.get("/users", getUsersController);
router.get("/reports", getReportsController);
router.get("/categories", getCategoriesController);
router.patch("/categories/:key", updateCategoryController);

module.exports = router;
