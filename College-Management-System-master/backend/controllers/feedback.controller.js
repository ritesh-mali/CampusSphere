const ApiResponse = require("../utils/ApiResponse");
const FeedbackForm = require("../models/feedback-form.model");
const FeedbackResponse = require("../models/feedback-response.model");
const FacultyDetail = require("../models/details/faculty-details.model");
const StudentDetail = require("../models/details/student-details.model");

const getRoleContext = async (userId) => {
  const faculty = await FacultyDetail.findById(userId).lean();
  if (faculty) return { role: "faculty", faculty };
  const student = await StudentDetail.findById(userId).lean();
  if (student) return { role: "student", student };
  return { role: null };
};

const createFeedbackFormController = async (req, res) => {
  try {
    const context = await getRoleContext(req.userId);
    if (context.role !== "faculty") {
      return ApiResponse.forbidden("Only faculty can create feedback forms").send(
        res
      );
    }

    const { title, description, questions, semester, targetSemesters } = req.body;
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return ApiResponse.badRequest(
        "title and questions are required"
      ).send(res);
    }

    const normalizedQuestions = questions
      .map((q) => ({
        text: String(q?.text || "").trim(),
        type: q?.type === "text" ? "text" : "rating",
      }))
      .filter((q) => q.text);

    if (!normalizedQuestions.length) {
      return ApiResponse.badRequest("At least one valid question is required").send(
        res
      );
    }

    const normalizedSemesters = Array.isArray(targetSemesters)
      ? targetSemesters
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item > 0)
      : semester
      ? [Number(semester)]
      : [];

    const form = await FeedbackForm.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      facultyId: req.userId,
      branchId: context.faculty.branchId || null,
      semester: normalizedSemesters.length ? normalizedSemesters[0] : semester || null,
      targetSemesters: normalizedSemesters,
      questions: normalizedQuestions,
      isActive: true,
    });

    return ApiResponse.created(form, "Feedback form created").send(res);
  } catch (error) {
    console.error("Create Feedback Form Error:", error);
    return ApiResponse.internalServerError("Failed to create feedback form").send(
      res
    );
  }
};

const getFeedbackFormsController = async (req, res) => {
  try {
    const context = await getRoleContext(req.userId);
    if (!context.role) {
      return ApiResponse.unauthorized("Invalid user").send(res);
    }

    let forms = [];
    if (context.role === "faculty") {
      forms = await FeedbackForm.find({ facultyId: req.userId, isActive: true })
        .populate("branchId", "name")
        .sort({ createdAt: -1 });
    } else {
      const studentBranchId = context.student?.branchId
        ? String(context.student.branchId)
        : "";
      const studentSemester = Number(context.student?.semester);
      const submitted = await FeedbackResponse.find({
        studentId: req.userId,
      })
        .select("formId")
        .lean();
      const submittedFormIds = submitted.map((item) => item.formId);

      forms = await FeedbackForm.find({
        isActive: true,
        branchId: context.student.branchId || null,
        _id: { $nin: submittedFormIds },
      })
        .populate("facultyId", "firstName lastName designation")
        .populate("branchId", "name")
        .sort({ createdAt: -1 });

      forms = forms.filter((form) => {
        const formBranchId = form?.branchId?._id
          ? String(form.branchId._id)
          : form?.branchId
          ? String(form.branchId)
          : "";
        const semesters = Array.isArray(form.targetSemesters)
          ? form.targetSemesters
          : form.semester
          ? [form.semester]
          : [];
        const semesterAllowed =
          semesters.length === 0 || semesters.includes(studentSemester);
        const branchAllowed = formBranchId && formBranchId === studentBranchId;
        return branchAllowed && semesterAllowed;
      });
    }

    return ApiResponse.success(forms, "Feedback forms fetched").send(res);
  } catch (error) {
    console.error("Get Feedback Forms Error:", error);
    return ApiResponse.internalServerError("Failed to fetch feedback forms").send(
      res
    );
  }
};

const submitFeedbackController = async (req, res) => {
  try {
    const context = await getRoleContext(req.userId);
    if (context.role !== "student") {
      return ApiResponse.forbidden("Only students can submit feedback").send(res);
    }

    const { formId, responses } = req.body;
    if (!formId || !Array.isArray(responses) || responses.length === 0) {
      return ApiResponse.badRequest("formId and responses are required").send(res);
    }

    const form = await FeedbackForm.findById(formId).lean();
    if (!form || !form.isActive) {
      return ApiResponse.notFound("Feedback form not found").send(res);
    }

    const studentBranchId = context.student?.branchId
      ? String(context.student.branchId)
      : "";
    const formBranchId = form.branchId ? String(form.branchId) : "";
    if (!studentBranchId || !formBranchId || studentBranchId !== formBranchId) {
      return ApiResponse.forbidden(
        "You are not allowed to submit this feedback form"
      ).send(res);
    }

    const formSemesters = Array.isArray(form.targetSemesters)
      ? form.targetSemesters
      : form.semester
      ? [form.semester]
      : [];
    if (
      formSemesters.length > 0 &&
      !formSemesters.includes(Number(context.student?.semester))
    ) {
      return ApiResponse.forbidden(
        "This feedback form is not assigned to your semester"
      ).send(res);
    }

    const alreadySubmitted = await FeedbackResponse.findOne({
      formId,
      studentId: req.userId,
    }).lean();
    if (alreadySubmitted) {
      return ApiResponse.conflict("Feedback already submitted for this form").send(
        res
      );
    }

    const cleanedResponses = responses
      .map((r, idx) => {
        const fallbackQuestion = form.questions[idx];
        const type = fallbackQuestion?.type || "text";
        return {
          questionText: String(
            r?.questionText || fallbackQuestion?.text || "Question"
          ).trim(),
          type,
          rating:
            type === "rating"
              ? Math.max(1, Math.min(5, Number(r?.rating) || 1))
              : null,
          text: type === "text" ? String(r?.text || "").trim() : "",
        };
      })
      .filter((r) => r.questionText);

    const saved = await FeedbackResponse.create({
      formId,
      facultyId: form.facultyId,
      studentId: req.userId,
      responses: cleanedResponses,
    });

    return ApiResponse.created(saved, "Feedback submitted successfully").send(res);
  } catch (error) {
    console.error("Submit Feedback Error:", error);
    return ApiResponse.internalServerError("Failed to submit feedback").send(res);
  }
};

const getFeedbackAnalyticsController = async (req, res) => {
  try {
    const context = await getRoleContext(req.userId);
    if (context.role !== "faculty") {
      return ApiResponse.forbidden("Only faculty can view analytics").send(res);
    }

    const forms = await FeedbackForm.find({
      facultyId: req.userId,
      isActive: true,
    }).lean();
    const formIds = forms.map((f) => f._id);
    const responses = await FeedbackResponse.find({
      facultyId: req.userId,
      formId: { $in: formIds },
    }).lean();

    const ratingValues = responses.flatMap((entry) =>
      entry.responses
        .filter((item) => item.type === "rating" && item.rating)
        .map((item) => item.rating)
    );
    const averageRating = ratingValues.length
      ? Number(
          (
            ratingValues.reduce((sum, rating) => sum + rating, 0) /
            ratingValues.length
          ).toFixed(2)
        )
      : 0;

    const responsesByForm = forms.map((form) => {
      const count = responses.filter(
        (entry) => String(entry.formId) === String(form._id)
      ).length;
      return {
        formId: form._id,
        title: form.title,
        responses: count,
      };
    });

    return ApiResponse.success(
      {
        averageRating,
        totalResponses: responses.length,
        responsesByForm,
      },
      "Feedback analytics fetched"
    ).send(res);
  } catch (error) {
    console.error("Feedback Analytics Error:", error);
    return ApiResponse.internalServerError(
      "Failed to fetch feedback analytics"
    ).send(res);
  }
};

module.exports = {
  createFeedbackFormController,
  getFeedbackFormsController,
  submitFeedbackController,
  getFeedbackAnalyticsController,
};
