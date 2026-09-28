const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { runCompilerController } = require("../controllers/compiler.controller");

const router = express.Router();

router.post("/run", auth, runCompilerController);

module.exports = router;
