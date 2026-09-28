const ApiResponse = require("../utils/ApiResponse");
const Attendance = require("../models/attendance.model");
const FacultyDetail = require("../models/details/faculty-details.model");
const StudentDetail = require("../models/details/student-details.model");
const Subject = require("../models/subject.model");

const getRoleContext = async (userId) => {
  const faculty = await FacultyDetail.findById(userId).lean();
  if (faculty) return { role: "faculty", faculty };
  const student = await StudentDetail.findById(userId).lean();
  if (student) return { role: "student", student };
  return { role: null };
};

const markAttendanceController = async (req, res) => {
  try {
    const context = await getRoleContext(req.userId);
    if (context.role !== "faculty") {
      return ApiResponse.forbidden("Only faculty can mark attendance").send(res);
    }

    const { subjectId, date, records } = req.body;
    if (!subjectId || !date || !Array.isArray(records) || records.length === 0) {
      return ApiResponse.badRequest(
        "subjectId, date and records are required"
      ).send(res);
    }

    const subject = await Subject.findById(subjectId).lean();
    if (!subject) {
      return ApiResponse.notFound("Subject not found").send(res);
    }

    const attendanceDate = new Date(date);
    if (Number.isNaN(attendanceDate.getTime())) {
      return ApiResponse.badRequest("Invalid date").send(res);
    }
    attendanceDate.setHours(0, 0, 0, 0);

    const operations = records.map((entry) => {
      const status = entry?.status === "absent" ? "absent" : "present";
      return Attendance.findOneAndUpdate(
        {
          studentId: entry.studentId,
          subjectId,
          date: attendanceDate,
        },
        {
          studentId: entry.studentId,
          subjectId,
          date: attendanceDate,
          status,
          markedBy: req.userId,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    await Promise.all(operations);
    return ApiResponse.success(null, "Attendance saved successfully").send(res);
  } catch (error) {
    console.error("Mark Attendance Error:", error);
    return ApiResponse.internalServerError("Failed to mark attendance").send(res);
  }
};

const getAttendanceStudentsController = async (req, res) => {
  try {
    const context = await getRoleContext(req.userId);
    if (context.role !== "faculty") {
      return ApiResponse.forbidden("Only faculty can view students").send(res);
    }

    const { semester, subjectId, date } = req.query;
    if (!semester) {
      return ApiResponse.badRequest("semester is required").send(res);
    }

    const students = await StudentDetail.find({
      semester: Number(semester),
      branchId: context.faculty.branchId,
    })
      .select("firstName middleName lastName enrollmentNo")
      .lean();

    let existingAttendance = [];
    if (subjectId && date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      existingAttendance = await Attendance.find({
        subjectId,
        date: attendanceDate,
        studentId: { $in: students.map((s) => s._id) },
      })
        .select("studentId status")
        .lean();
    }

    const subjectFilter = subjectId ? { subjectId } : {};
    const allRecords = await Attendance.find({
      studentId: { $in: students.map((s) => s._id) },
      ...subjectFilter,
    })
      .select("studentId status")
      .lean();

    const summaryByStudent = students.map((student) => {
      const studentRecords = allRecords.filter(
        (record) => String(record.studentId) === String(student._id)
      );
      const totalClasses = studentRecords.length;
      const presentClasses = studentRecords.filter(
        (record) => record.status === "present"
      ).length;
      const percentage =
        totalClasses > 0
          ? Number(((presentClasses / totalClasses) * 100).toFixed(2))
          : 0;
      return {
        studentId: student._id,
        totalClasses,
        presentClasses,
        percentage,
      };
    });

    return ApiResponse.success(
      {
        students,
        existingAttendance,
        summaryByStudent,
      },
      "Students fetched successfully"
    ).send(res);
  } catch (error) {
    console.error("Get Attendance Students Error:", error);
    return ApiResponse.internalServerError("Failed to fetch students").send(res);
  }
};

const getMyAttendanceController = async (req, res) => {
  try {
    const context = await getRoleContext(req.userId);
    if (context.role !== "student") {
      return ApiResponse.forbidden("Only students can view attendance").send(res);
    }

    const records = await Attendance.find({ studentId: req.userId })
      .populate("subjectId", "name code")
      .sort({ date: -1 })
      .lean();

    const totalClasses = records.length;
    const presentClasses = records.filter((r) => r.status === "present").length;
    const percentage =
      totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(2)) : 0;

    return ApiResponse.success(
      {
        percentage,
        totalClasses,
        presentClasses,
        records,
      },
      "Attendance fetched successfully"
    ).send(res);
  } catch (error) {
    console.error("Get My Attendance Error:", error);
    return ApiResponse.internalServerError("Failed to fetch attendance").send(res);
  }
};

module.exports = {
  markAttendanceController,
  getAttendanceStudentsController,
  getMyAttendanceController,
};
