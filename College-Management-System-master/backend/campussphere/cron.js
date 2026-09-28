const cron = require("node-cron");
const Material = require("../models/material.model");
const StudentDetail = require("../models/details/student-details.model");
const mongoReady = require("../utils/mongoReady");
const { bulkNotifyUsers } = require("./notificationService");

/**
 * Hourly: notify students when an assignment is due within the next 24 hours (once per material).
 */
function startCampusCron() {
  cron.schedule("0 * * * *", async () => {
    if (!mongoReady()) return;
    try {
      const now = new Date();
      const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const materials = await Material.find({
        type: "assignment",
        dueDate: { $gt: now, $lte: in24 },
        assignmentReminderSent: { $ne: true },
      });

      for (const m of materials) {
        const students = await StudentDetail.find({
          branchId: m.branch,
          semester: m.semester,
        }).select("_id");
        const ids = students.map((s) => String(s._id));
        if (ids.length) {
          await bulkNotifyUsers(
            ids,
            `Reminder: assignment "${m.title}" is due within 24 hours.`,
            "assignment_deadline"
          );
        }
        m.assignmentReminderSent = true;
        await m.save();
      }
    } catch (e) {
      console.error("CampusSphere deadline cron:", e.message);
    }
  });
}

module.exports = { startCampusCron };
