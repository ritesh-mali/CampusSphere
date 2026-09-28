const express = require("express");
const auth = require("../middlewares/auth.middleware");
const studentOnly = require("../middlewares/studentOnly.middleware");
const facultyOrAdmin = require("../middlewares/facultyOrAdmin.middleware");
const adminOnly = require("../middlewares/adminOnly.middleware");
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  registerStudent,
  listRegistrations,
} = require("../controllers/campussphere/events.controller");

const router = express.Router();

router.get("/", auth, listEvents);
router.post("/", auth, facultyOrAdmin, createEvent);
router.get("/:id/registrations", auth, adminOnly, listRegistrations);
router.get("/:id", auth, getEvent);
router.patch("/:id", auth, facultyOrAdmin, updateEvent);
router.post("/:id/register", auth, studentOnly, registerStudent);

module.exports = router;
