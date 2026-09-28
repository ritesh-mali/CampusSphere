const ApiResponse = require("../utils/ApiResponse");
const TimetableEntry = require("../models/timetable-entry.model");
const StudentDetail = require("../models/details/student-details.model");
const FacultyDetail = require("../models/details/faculty-details.model");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function semesterToClassYear(semester) {
  const sem = Number(semester);
  if ([1, 2].includes(sem)) return "FY";
  if ([3, 4].includes(sem)) return "SY";
  if ([5, 6].includes(sem)) return "TY";
  if ([7, 8].includes(sem)) return "BE";
  return null;
}

function isValidTimeHHMM(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(value) {
  const [h, m] = String(value).split(":").map((v) => Number(v));
  return h * 60 + m;
}

async function resolveRequestRole(req) {
  const [student, faculty] = await Promise.all([
    StudentDetail.findById(req.userId).populate("branchId").lean(),
    FacultyDetail.findById(req.userId).select("_id firstName lastName").lean(),
  ]);
  if (student) {
    const classYear = semesterToClassYear(student.semester);
    const department = student.branchId?.name;
    return {
      role: "student",
      student,
      classYear,
      department,
    };
  }
  if (faculty) {
    return {
      role: "faculty",
      faculty,
      facultyName: `${faculty.firstName} ${faculty.lastName}`.trim(),
    };
  }
  return { role: "unknown" };
}

const listTimetableEntries = async (req, res) => {
  try {
    const info = await resolveRequestRole(req);

    const query = {};

    if (info.role === "student") {
      if (!info.classYear || !info.department) {
        return ApiResponse.badRequest(
          "Student profile missing semester/branch info"
        ).send(res);
      }
      query.class_year = info.classYear;
      query.department = info.department;
    } else {
      const { class_year, department, day } = req.query;
      if (class_year) query.class_year = class_year;
      if (department) query.department = department;
      if (day) query.day = day;
    }

    const entries = await TimetableEntry.find(query).sort({
      day: 1,
      start_time: 1,
      end_time: 1,
      createdAt: -1,
    });

    return ApiResponse.success(entries, "Timetable entries retrieved").send(res);
  } catch (e) {
    console.error("listTimetableEntries error:", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const createTimetableEntry = async (req, res) => {
  try {
    const info = await resolveRequestRole(req);
    if (info.role !== "faculty" && info.role !== "unknown") {
      // Only faculty/admin middleware should reach here; keep defensive.
    }

    const {
      subject,
      day,
      start_time,
      end_time,
      class_year,
      department,
      faculty: facultyFromBody,
    } = req.body;

    if (!subject || !day || !start_time || !end_time || !class_year || !department) {
      return ApiResponse.badRequest("All fields are required").send(res);
    }
    if (!DAYS.includes(day)) {
      return ApiResponse.badRequest("Invalid day").send(res);
    }
    if (!isValidTimeHHMM(start_time) || !isValidTimeHHMM(end_time)) {
      return ApiResponse.badRequest("Invalid time format (HH:MM)").send(res);
    }
    if (timeToMinutes(end_time) <= timeToMinutes(start_time)) {
      return ApiResponse.badRequest("End time must be after start time").send(res);
    }

    // Prefer authoritative faculty name from login, fallback to body.
    const facultyName = info.facultyName || String(facultyFromBody || "").trim();
    if (!facultyName) {
      return ApiResponse.badRequest("Faculty name is required").send(res);
    }

    const createdRole = req.campusCreatorRole || "faculty";

    const entry = await TimetableEntry.create({
      subject,
      faculty: facultyName,
      day,
      start_time,
      end_time,
      class_year,
      department,
      createdBy: req.userId,
      createdRole,
    });

    return ApiResponse.created(entry, "Timetable entry created").send(res);
  } catch (e) {
    console.error("createTimetableEntry error:", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return ApiResponse.badRequest("Entry id required").send(res);

    const existing = await TimetableEntry.findById(id);
    if (!existing) return ApiResponse.notFound("Entry not found").send(res);

    const isAdmin = req.campusCreatorRole === "admin";
    const isOwner = String(existing.createdBy) === String(req.userId);
    if (!isAdmin && !isOwner) {
      return ApiResponse.forbidden("You can only edit your own entries").send(res);
    }

    const info = await resolveRequestRole(req);

    const patch = { ...req.body };
    delete patch.createdBy;
    delete patch.createdRole;

    if (patch.day && !DAYS.includes(patch.day)) {
      return ApiResponse.badRequest("Invalid day").send(res);
    }
    if (patch.start_time && !isValidTimeHHMM(patch.start_time)) {
      return ApiResponse.badRequest("Invalid start time (HH:MM)").send(res);
    }
    if (patch.end_time && !isValidTimeHHMM(patch.end_time)) {
      return ApiResponse.badRequest("Invalid end time (HH:MM)").send(res);
    }
    const st = patch.start_time || existing.start_time;
    const et = patch.end_time || existing.end_time;
    if (st && et && timeToMinutes(et) <= timeToMinutes(st)) {
      return ApiResponse.badRequest("End time must be after start time").send(res);
    }

    // Keep faculty name authoritative if faculty is updating.
    if (!isAdmin && info.facultyName) {
      patch.faculty = info.facultyName;
    }

    const updated = await TimetableEntry.findByIdAndUpdate(id, patch, {
      new: true,
    });
    return ApiResponse.success(updated, "Timetable entry updated").send(res);
  } catch (e) {
    console.error("updateTimetableEntry error:", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return ApiResponse.badRequest("Entry id required").send(res);

    const existing = await TimetableEntry.findById(id);
    if (!existing) return ApiResponse.notFound("Entry not found").send(res);

    const isAdmin = req.campusCreatorRole === "admin";
    const isOwner = String(existing.createdBy) === String(req.userId);
    if (!isAdmin && !isOwner) {
      return ApiResponse.forbidden("You can only delete your own entries").send(res);
    }

    await TimetableEntry.findByIdAndDelete(id);
    return ApiResponse.success(null, "Timetable entry deleted").send(res);
  } catch (e) {
    console.error("deleteTimetableEntry error:", e);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  listTimetableEntries,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  semesterToClassYear,
};

