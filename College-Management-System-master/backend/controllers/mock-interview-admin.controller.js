const ApiResponse = require("../utils/ApiResponse");
const MockInterviewResult = require("../models/mock-interview-result.model");
const MockInterviewSession = require("../models/mock-interview-session.model");
const InterviewCategory = require("../models/interview-category.model");
const studentDetails = require("../models/details/student-details.model");
const { INTERVIEW_ROLES } = require("../constants/interview-roles");

const seedCategoriesIfEmpty = async () => {
  const count = await InterviewCategory.countDocuments();
  if (count > 0) return;
  await InterviewCategory.insertMany(
    INTERVIEW_ROLES.map((role, index) => ({
      key: role.id,
      label: role.label,
      category: role.category,
      isActive: true,
      sortOrder: index,
    }))
  );
};

const getAnalyticsController = async (_req, res) => {
  await seedCategoriesIfEmpty();

  const [totalSessions, completedSessions, totalResults, avgScoreAgg] =
    await Promise.all([
      MockInterviewSession.countDocuments(),
      MockInterviewSession.countDocuments({ status: "completed" }),
      MockInterviewResult.countDocuments(),
      MockInterviewResult.aggregate([
        { $group: { _id: null, avg: { $avg: "$scores.overall" } } },
      ]),
    ]);

  const roleBreakdown = await MockInterviewResult.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);

  const recentResults = await MockInterviewResult.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("userId role scores.overall createdAt")
    .populate("userId", "firstName lastName enrollmentNo")
    .lean();

  return ApiResponse.success({
    analytics: {
      totalSessions,
      completedSessions,
      totalResults,
      averageOverallScore: Math.round(avgScoreAgg[0]?.avg || 0),
      roleBreakdown,
      aiUsageEstimate: totalResults * 3,
    },
    recentResults,
  }).send(res);
};

const getUsersController = async (_req, res) => {
  const students = await studentDetails
    .find()
    .select("firstName lastName enrollmentNo email")
    .limit(200)
    .lean();

  const resultCounts = await MockInterviewResult.aggregate([
    { $group: { _id: "$userId", interviews: { $sum: 1 }, avgScore: { $avg: "$scores.overall" } } },
  ]);

  const countMap = new Map(
    resultCounts.map((r) => [String(r._id), r])
  );

  const users = students.map((s) => {
    const stats = countMap.get(String(s._id));
    return {
      ...s,
      interviewCount: stats?.interviews || 0,
      averageScore: Math.round(stats?.avgScore || 0),
    };
  });

  return ApiResponse.success({ users }).send(res);
};

const getReportsController = async (req, res) => {
  const limit = Math.min(100, Number(req.query.limit) || 30);
  const reports = await MockInterviewResult.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "firstName lastName enrollmentNo")
    .lean();

  return ApiResponse.success({ reports }).send(res);
};

const getCategoriesController = async (_req, res) => {
  await seedCategoriesIfEmpty();
  const categories = await InterviewCategory.find().sort({ sortOrder: 1 }).lean();
  return ApiResponse.success({ categories }).send(res);
};

const updateCategoryController = async (req, res) => {
  const { key } = req.params;
  const { label, category, isActive, sortOrder } = req.body || {};

  const updated = await InterviewCategory.findOneAndUpdate(
    { key },
    {
      ...(label !== undefined ? { label } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    },
    { new: true }
  );

  if (!updated) {
    return ApiResponse.notFound("Category not found").send(res);
  }

  return ApiResponse.success({ category: updated }).send(res);
};

module.exports = {
  getAnalyticsController,
  getUsersController,
  getReportsController,
  getCategoriesController,
  updateCategoryController,
};
