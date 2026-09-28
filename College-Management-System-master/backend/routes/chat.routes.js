const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { sendChatMessageController } = require("../controllers/chat.controller");

const router = express.Router();

router.post("/", auth, sendChatMessageController);

module.exports = router;
