const mongoose = require("mongoose");
const ApiResponse = require("../../utils/ApiResponse");
const CampusNotification = require("../../models/campus-notification.model");
const CampusNotificationPref = require("../../models/campus-notification-pref.model");

function serializeNotification(n) {
  return {
    id: n._id.toString(),
    user_id: n.userId,
    message: n.message,
    type: n.type,
    status: n.status,
    created_at: n.createdAt,
  };
}

async function listMine(req, res) {
  const userId = String(req.userId);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const [rows, unreadCount] = await Promise.all([
    CampusNotification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    CampusNotification.countDocuments({ userId, status: "unread" }),
  ]);
  return ApiResponse.success(
    {
      notifications: rows.map(serializeNotification),
      unreadCount,
    },
    "OK"
  ).send(res);
}

async function markRead(req, res) {
  const userId = String(req.userId);
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return ApiResponse.badRequest("Invalid id").send(res);
  }
  await CampusNotification.findOneAndUpdate(
    { _id: id, userId },
    { status: "read" }
  );
  return ApiResponse.success(null, "Marked read").send(res);
}

async function markAllRead(req, res) {
  const userId = String(req.userId);
  await CampusNotification.updateMany({ userId, status: "unread" }, { status: "read" });
  return ApiResponse.success(null, "All marked read").send(res);
}

async function getPrefs(req, res) {
  const userId = String(req.userId);
  const pref = await CampusNotificationPref.findOne({ userId }).lean();
  return ApiResponse.success(
    { emailEnabled: pref ? !!pref.emailEnabled : false },
    "OK"
  ).send(res);
}

async function setPrefs(req, res) {
  const userId = String(req.userId);
  const emailEnabled = !!req.body.emailEnabled;
  await CampusNotificationPref.findOneAndUpdate(
    { userId },
    { userId, emailEnabled },
    { upsert: true, new: true }
  );
  return ApiResponse.success({ emailEnabled }, "Saved").send(res);
}

module.exports = {
  listMine,
  markRead,
  markAllRead,
  getPrefs,
  setPrefs,
};
