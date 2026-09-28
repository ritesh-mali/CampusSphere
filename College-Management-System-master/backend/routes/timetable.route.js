require("dotenv").config();
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");
const auth = require("../middlewares/auth.middleware");
const facultyOrAdmin = require("../middlewares/facultyOrAdmin.middleware");
const {
  getTimetableController,
  addTimetableController,
  updateTimetableController,
  deleteTimetableController,
} = require("../controllers/timetable.controller");
const {
  listTimetableEntries,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} = require("../controllers/timetableEntries.controller");

router.get("/", auth, getTimetableController);

router.post("/", auth, upload.single("file"), addTimetableController);

router.put("/:id", auth, upload.single("file"), updateTimetableController);

router.delete("/:id", auth, deleteTimetableController);

// Timetable Entries (weekly grid)
router.get("/entries", auth, listTimetableEntries);
router.post("/entries", auth, facultyOrAdmin, createTimetableEntry);
router.put("/entries/:id", auth, facultyOrAdmin, updateTimetableEntry);
router.delete("/entries/:id", auth, facultyOrAdmin, deleteTimetableEntry);

module.exports = router;
