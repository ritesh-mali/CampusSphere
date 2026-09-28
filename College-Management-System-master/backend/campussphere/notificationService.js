/**
 * Persists notifications in MongoDB and pushes to Socket.io room `user_<mongoId>`.
 */
const mongoose = require("mongoose");
const CampusNotification = require("../models/campus-notification.model");
const CampusNotificationPref = require("../models/campus-notification-pref.model");
const StudentDetail = require("../models/details/student-details.model");
const sendNotificationEmail = require("../utils/sendNotificationEmail");

let ioRef = null;

function setNotificationIo(io) {
  ioRef = io;
}

function emitToUser(userId, payload) {
  if (ioRef) {
    ioRef.to(`user_${userId}`).emit("campus_notification", payload);
  }
}

async function getUserEmailEnabled(userId) {
  const pref = await CampusNotificationPref.findOne({ userId }).lean();
  return pref ? !!pref.emailEnabled : false;
}

async function createNotification(userId, message, type, meta = {}) {
  const doc = await CampusNotification.create({
    userId,
    message: message.slice(0, 512),
    type,
    status: "unread",
  });
  const id = doc._id.toString();
  const payload = {
    id,
    user_id: userId,
    message: doc.message,
    type: doc.type,
    status: doc.status,
    created_at: doc.createdAt.toISOString(),
  };
  emitToUser(userId, payload);

  if (meta.sendEmail !== false) {
    const want = await getUserEmailEnabled(userId);
    if (want) {
      const student = await StudentDetail.findById(userId).select("email");
      if (student?.email) {
        await sendNotificationEmail(
          student.email,
          "CampusSphere notification",
          message
        );
      }
    }
  }
  return id;
}

async function bulkNotifyUsers(userIds, message, type) {
  if (!userIds.length) return;
  const msg = message.slice(0, 512);
  const docs = userIds.map((uid) => ({
    userId: uid,
    message: msg,
    type,
    status: "unread",
  }));
  await CampusNotification.insertMany(docs);
  const now = new Date().toISOString();
  userIds.forEach((uid) => {
    emitToUser(uid, {
      message: msg,
      type,
      status: "unread",
      created_at: now,
    });
  });
}

async function notifyAllStudents(message, type) {
  if (mongoose.connection.readyState !== 1) return;
  const students = await StudentDetail.find().select("_id");
  const ids = students.map((s) => String(s._id));
  const chunk = 200;
  for (let i = 0; i < ids.length; i += chunk) {
    await bulkNotifyUsers(ids.slice(i, i + chunk), message, type);
  }
}

async function notifyStudentsByBranchSemester(branchId, semester, message, type) {
  if (mongoose.connection.readyState !== 1) return;
  const students = await StudentDetail.find({
    branchId,
    semester: Number(semester),
  }).select("_id");
  const ids = students.map((s) => String(s._id));
  await bulkNotifyUsers(ids, message, type);
}

module.exports = {
  setNotificationIo,
  createNotification,
  bulkNotifyUsers,
  notifyAllStudents,
  notifyStudentsByBranchSemester,
};
