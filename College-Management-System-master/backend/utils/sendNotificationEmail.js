const nodemailer = require("nodemailer");

/**
 * Optional email for CampusSphere notifications.
 * Requires NODEMAILER_EMAIL / NODEMAILER_PASS (same as password reset) or returns false.
 */
async function sendNotificationEmail(to, subject, text) {
  if (!to || process.env.CAMPUS_NOTIFICATION_EMAILS !== "true") {
    return false;
  }
  if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASS) {
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL || process.env.NODEMAILER_EMAIL,
      to,
      subject,
      text,
    });
    return true;
  } catch (e) {
    console.error("sendNotificationEmail:", e.message);
    return false;
  }
}

module.exports = sendNotificationEmail;
