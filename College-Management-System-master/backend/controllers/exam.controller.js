const Exam = require("../models/exam.model");
const ApiResponse = require("../utils/ApiResponse");
const ExamAttempt = require("../models/exam-attempt.model");
const StudentDetail = require("../models/details/student-details.model");
const mongoReady = require("../utils/mongoReady");
const { notifyStudentsByBranchSemester } = require("../campussphere/notificationService");

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeWeekStartDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const getAssignedWeeklyExamsController = async (req, res) => {
  try {
    // Student listing: by branchId + semester + published
    let { branchId, semester } = req.query;
    if (!branchId || !semester) {
      // fallback: infer from logged-in student record
      const student = await StudentDetail.findById(req.userId).select(
        "branchId semester"
      );
      branchId = student?.branchId?.toString();
      semester = student?.semester;
    }

    if (!branchId || !semester) {
      return ApiResponse.badRequest("branchId and semester are required").send(
        res
      );
    }

    const exams = await Exam.find({
      branchId,
      semester: Number(semester),
      status: "published",
    })
      .select("-questions.correctOptionIndex")
      .sort({ weekStartDate: -1 });

    return ApiResponse.success(exams, "Weekly exams loaded").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const getFacultyWeeklyExamsController = async (req, res) => {
  try {
    const exams = await Exam.find({ createdByFacultyId: req.userId }).sort({
      createdAt: -1,
    });
    return ApiResponse.success(exams, "Weekly exams loaded").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const createWeeklyExamController = async (req, res) => {
  try {
    const { title, weekStartDate, branchId, semester, durationMinutes } =
      req.body;

    const normalizedDate = normalizeWeekStartDate(weekStartDate);
    if (!title || !normalizedDate || !branchId || !semester) {
      return ApiResponse.badRequest(
        "title, weekStartDate, branchId and semester are required"
      ).send(res);
    }

    const exam = await Exam.create({
      title,
      weekStartDate: normalizedDate,
      branchId,
      semester: Number(semester),
      durationMinutes: Number(durationMinutes || 30),
      createdByFacultyId: req.userId,
      status: "draft",
    });

    return ApiResponse.created(exam, "Weekly exam created").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const addMcqQuestionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, options, correctOptionIndex, marks } = req.body;

    const exam = await Exam.findById(id);
    if (!exam) return ApiResponse.notFound("Weekly exam not found").send(res);

    if (exam.createdByFacultyId.toString() !== String(req.userId)) {
      return ApiResponse.unauthorized("Not allowed").send(res);
    }

    if (exam.status !== "draft") {
      return ApiResponse.badRequest(
        "Cannot add questions after publishing"
      ).send(res);
    }

    const parsedOptions = parseJsonField(options, null);
    if (
      !questionText ||
      !Array.isArray(parsedOptions) ||
      parsedOptions.length < 2
    ) {
      return ApiResponse.badRequest(
        "questionText and options (JSON array) are required"
      ).send(res);
    }

    const correctIdx = Number(correctOptionIndex);
    if (
      Number.isNaN(correctIdx) ||
      correctIdx < 0 ||
      correctIdx >= parsedOptions.length
    ) {
      return ApiResponse.badRequest("Invalid correctOptionIndex").send(res);
    }

    exam.questions.push({
      questionText,
      options: parsedOptions,
      correctOptionIndex: correctIdx,
      marks: Number(marks || 1),
    });
    await exam.save();

    return ApiResponse.success(exam, "Question added").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const publishWeeklyExamController = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) return ApiResponse.notFound("Weekly exam not found").send(res);

    if (exam.createdByFacultyId.toString() !== String(req.userId)) {
      return ApiResponse.unauthorized("Not allowed").send(res);
    }

    if (!exam.questions || exam.questions.length === 0) {
      return ApiResponse.badRequest("Add at least 1 question before publishing")
        .send(res);
    }

    exam.status = "published";
    await exam.save();

    if (mongoReady()) {
      notifyStudentsByBranchSemester(
        exam.branchId,
        exam.semester,
        `A weekly exam is now available: ${exam.title}`,
        "exam_schedule"
      ).catch((e) => console.error("exam notify:", e.message));
    }

    return ApiResponse.success(exam, "Weekly exam published").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const getWeeklyExamForStudentController = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id).select("-questions.correctOptionIndex");
    if (!exam) return ApiResponse.notFound("Weekly exam not found").send(res);

    // Ensure the logged in user matches target (student must belong to branch+sem)
    const student = await StudentDetail.findById(req.userId).select(
      "branchId semester"
    );
    if (
      !student ||
      student.branchId.toString() !== exam.branchId.toString() ||
      Number(student.semester) !== Number(exam.semester)
    ) {
      return ApiResponse.unauthorized("Not allowed").send(res);
    }

    if (exam.status !== "published") {
      return ApiResponse.badRequest("Exam not published yet").send(res);
    }

    return ApiResponse.success(exam, "Weekly exam loaded").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const submitWeeklyExamController = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, violations, isAutoSubmitted } = req.body;

    const exam = await Exam.findById(id);
    if (!exam) return ApiResponse.notFound("Weekly exam not found").send(res);
    if (exam.status !== "published") {
      return ApiResponse.badRequest("Exam not published yet").send(res);
    }

    const student = await StudentDetail.findById(req.userId).select(
      "branchId semester"
    );
    if (
      !student ||
      student.branchId.toString() !== exam.branchId.toString() ||
      Number(student.semester) !== Number(exam.semester)
    ) {
      return ApiResponse.unauthorized("Not allowed").send(res);
    }

    if (!Array.isArray(answers)) {
      return ApiResponse.badRequest("answers must be an array").send(res);
    }

    const existingAttempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: req.userId,
    }).select("_id");
    if (existingAttempt) {
      return ApiResponse.conflict("You already submitted this exam").send(res);
    }

    const byQuestionId = new Map();
    for (const a of answers) {
      if (!a?.questionId) continue;
      byQuestionId.set(String(a.questionId), Number(a.selectedOptionIndex));
    }

    let score = 0;
    let totalMarks = 0;
    const storedAnswers = [];

    for (const q of exam.questions) {
      totalMarks += Number(q.marks || 1);
      const selected = byQuestionId.get(String(q._id));
      if (selected === undefined || Number.isNaN(selected)) continue;

      storedAnswers.push({
        questionId: q._id,
        selectedOptionIndex: selected,
      });

      if (Number(selected) === Number(q.correctOptionIndex)) {
        score += Number(q.marks || 1);
      }
    }

    const safeViolations = {
      tabSwitchCount: Number(violations?.tabSwitchCount || 0),
      blurCount: Number(violations?.blurCount || 0),
      fullscreenExitCount: Number(violations?.fullscreenExitCount || 0),
      copyCount: Number(violations?.copyCount || 0),
      pasteCount: Number(violations?.pasteCount || 0),
      rightClickCount: Number(violations?.rightClickCount || 0),
    };

    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: req.userId,
      answers: storedAnswers,
      score,
      totalMarks,
      submittedAt: new Date(),
      violations: safeViolations,
      isAutoSubmitted: Boolean(isAutoSubmitted),
    });

    // IMPORTANT: don't reveal score to student
    return ApiResponse.success({ attemptId: attempt._id }, "Exam submitted").send(
      res
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const getWeeklyExamResultsForFacultyController = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) return ApiResponse.notFound("Weekly exam not found").send(res);

    if (exam.createdByFacultyId.toString() !== String(req.userId)) {
      return ApiResponse.unauthorized("Not allowed").send(res);
    }

    const attempts = await ExamAttempt.find({ examId: id })
      .populate("studentId", "enrollmentNo firstName middleName lastName email semester branchId")
      .sort({ submittedAt: -1 });

    return ApiResponse.success(
      { exam, attempts },
      "Results loaded"
    ).send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const deleteWeeklyExamController = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) return ApiResponse.notFound("Weekly exam not found").send(res);

    if (exam.createdByFacultyId.toString() !== String(req.userId)) {
      return ApiResponse.unauthorized("Not allowed").send(res);
    }

    await ExamAttempt.deleteMany({ examId: id });
    await Exam.findByIdAndDelete(id);
    return ApiResponse.success(null, "Weekly exam deleted").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

module.exports = {
  getAssignedWeeklyExamsController,
  getFacultyWeeklyExamsController,
  createWeeklyExamController,
  addMcqQuestionController,
  publishWeeklyExamController,
  getWeeklyExamForStudentController,
  submitWeeklyExamController,
  getWeeklyExamResultsForFacultyController,
  deleteWeeklyExamController,
};
