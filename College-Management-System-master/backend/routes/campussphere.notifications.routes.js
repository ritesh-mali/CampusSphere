const express = require("express");
const auth = require("../middlewares/auth.middleware");
const {
  listMine,
  markRead,
  markAllRead,
  getPrefs,
  setPrefs,
} = require("../controllers/campussphere/notifications.controller");

const router = express.Router();

router.get("/", auth, listMine);
router.patch("/:id/read", auth, markRead);
router.post("/read-all", auth, markAllRead);
router.get("/prefs", auth, getPrefs);
router.post("/prefs", auth, setPrefs);

module.exports = router;
