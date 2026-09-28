const connectToMongo = require("./database/db");
const http = require("http");
const express = require("express");
const app = express();
const path = require("path");
connectToMongo();
const port = Number(process.env.PORT) || 4000;
var cors = require("cors");

const configuredOrigins = (
  process.env.FRONTEND_API_LINKS || process.env.FRONTEND_API_LINK || ""
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header), configured origins, and localhost dev ports.
      const normalizedOrigin = origin ? origin.replace(/\/$/, "") : origin;
      if (
        !normalizedOrigin ||
        allowedOrigins.has(normalizedOrigin) ||
        localhostRegex.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json()); //to convert request data to json

app.get("/", (req, res) => {
  res.send("Hello 👋 I am Working Fine 🚀");
});

app.use("/media", express.static(path.join(__dirname, "media")));

app.use("/api/admin", require("./routes/details/admin-details.route"));
app.use("/api/faculty", require("./routes/details/faculty-details.route"));
app.use("/api/student", require("./routes/details/student-details.route"));

app.use("/api/branch", require("./routes/branch.route"));
app.use("/api/subject", require("./routes/subject.route"));
app.use("/api/notice", require("./routes/notice.route"));
app.use("/api/timetable", require("./routes/timetable.route"));
app.use("/api/material", require("./routes/material.route"));
app.use("/api/exam", require("./routes/exam.route"));
app.use("/api/marks", require("./routes/marks.route"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/interview", require("./routes/interview.routes"));
app.use("/api/mock-interview", require("./routes/mock-interview.routes"));
app.use(
  "/api/mock-interview/admin",
  require("./routes/mock-interview-admin.routes")
);
app.use("/api/feedback", require("./routes/feedback.routes"));
app.use("/api/compiler", require("./routes/compiler.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/bonafide", require("./routes/bonafide.routes"));

app.use("/api/campussphere/resume", require("./routes/campussphere.resume.routes"));
app.use("/api/campussphere/placement", require("./routes/campussphere.placement.routes"));
app.use("/api/campussphere/events", require("./routes/campussphere.events.routes"));
app.use("/api/campussphere/notifications", require("./routes/campussphere.notifications.routes"));

const server = http.createServer(app);
const { initCampusSocket } = require("./campussphere/socket");
const { setNotificationIo } = require("./campussphere/notificationService");
const io = initCampusSocket(server);
setNotificationIo(io);

const { startCampusCron } = require("./campussphere/cron");
startCampusCron();

server.listen(port, () => {
  console.log(`Server Listening On http://localhost:${port}`);
});
