const mongoose = require("mongoose");
const ApiResponse = require("../../utils/ApiResponse");
const PlacementCompany = require("../../models/placement-company.model");
const PlacementQuestion = require("../../models/placement-question.model");
const PlacementQuizAttempt = require("../../models/placement-quiz-attempt.model");
const { ensurePlacementSeed } = require("../../campussphere/placementSeed");

async function listCompanies(_req, res) {
  await ensurePlacementSeed();
  const companies = await PlacementCompany.find().sort({ name: 1 }).lean();
  const rows = await Promise.all(
    companies.map(async (c) => {
      const cid = c._id;
      const [aptitude_count, technical_count, hr_count] = await Promise.all([
        PlacementQuestion.countDocuments({ companyId: cid, section: "aptitude" }),
        PlacementQuestion.countDocuments({ companyId: cid, section: "technical" }),
        PlacementQuestion.countDocuments({ companyId: cid, section: "hr" }),
      ]);
      return {
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description,
        aptitude_count,
        technical_count,
        hr_count,
      };
    })
  );
  return ApiResponse.success(rows, "Companies loaded").send(res);
}

async function getCompany(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return ApiResponse.badRequest("Invalid company id").send(res);
  }
  const c = await PlacementCompany.findById(req.params.id).lean();
  if (!c) return ApiResponse.notFound("Company not found").send(res);
  return ApiResponse.success(
    { id: c._id.toString(), name: c.name, slug: c.slug, description: c.description },
    "Company loaded"
  ).send(res);
}

async function getQuizQuestions(req, res) {
  const companyId = req.params.id;
  if (!mongoose.isValidObjectId(companyId)) {
    return ApiResponse.badRequest("Invalid company id").send(res);
  }
  const section = req.params.section;
  if (!["aptitude", "technical", "hr"].includes(section)) {
    return ApiResponse.badRequest("Invalid section").send(res);
  }
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const oid = new mongoose.Types.ObjectId(companyId);
  const rows = await PlacementQuestion.aggregate([
    { $match: { companyId: oid, section } },
    { $sample: { size: limit } },
  ]);
  const questions = rows.map((q) => ({
    id: q._id.toString(),
    question: q.questionText,
    options: q.options,
  }));
  return ApiResponse.success({ questions, limit }, "Questions loaded").send(res);
}

async function submitQuiz(req, res) {
  const userId = String(req.userId);
  const companyId = req.params.id;
  if (!mongoose.isValidObjectId(companyId)) {
    return ApiResponse.badRequest("Invalid company id").send(res);
  }
  const { section, answers, durationSeconds } = req.body;
  if (!["aptitude", "technical", "hr"].includes(section)) {
    return ApiResponse.badRequest("Invalid section").send(res);
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return ApiResponse.badRequest("answers[] required").send(res);
  }

  const ids = answers.map((a) => a.questionId).filter((id) => mongoose.isValidObjectId(id));
  if (!ids.length) return ApiResponse.badRequest("Invalid question ids").send(res);

  const oid = new mongoose.Types.ObjectId(companyId);
  const dbQs = await PlacementQuestion.find({
    _id: { $in: ids },
    companyId: oid,
    section,
  }).lean();
  const byId = Object.fromEntries(dbQs.map((q) => [q._id.toString(), q]));

  let score = 0;
  const detail = [];
  for (const a of answers) {
    const qid = String(a.questionId);
    const q = byId[qid];
    if (!q) continue;
    const selected = Number(a.selectedIndex);
    const correct = Number(q.correctIndex);
    const ok = selected === correct;
    if (ok) score += 1;
    detail.push({
      questionId: qid,
      question: q.questionText,
      options: q.options,
      selectedIndex: selected,
      correctIndex: correct,
      isCorrect: ok,
    });
  }
  const total = detail.length;

  await PlacementQuizAttempt.create({
    userId,
    companyId: oid,
    section,
    score,
    total,
    durationSeconds: durationSeconds != null ? Number(durationSeconds) : null,
    detail,
  });

  return ApiResponse.success(
    { score, total, percentage: total ? Math.round((score / total) * 100) : 0, results: detail },
    "Quiz submitted"
  ).send(res);
}

async function myAttempts(req, res) {
  const userId = String(req.userId);
  const attempts = await PlacementQuizAttempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("companyId", "name")
    .lean();
  const rows = attempts.map((a) => ({
    id: a._id.toString(),
    user_id: a.userId,
    company_id: a.companyId?._id?.toString(),
    section: a.section,
    score: a.score,
    total: a.total,
    duration_seconds: a.durationSeconds,
    detail_json: a.detail,
    created_at: a.createdAt,
    company_name: a.companyId?.name || "",
  }));
  return ApiResponse.success(rows, "Attempts loaded").send(res);
}

async function adminUpsertCompany(req, res) {
  const { id, name, slug, description } = req.body;
  if (!name || !slug) {
    return ApiResponse.badRequest("name and slug required").send(res);
  }
  const slugNorm = String(slug).trim().toLowerCase().replace(/\s+/g, "-");
  if (id) {
    if (!mongoose.isValidObjectId(id)) {
      return ApiResponse.badRequest("Invalid company id").send(res);
    }
    await PlacementCompany.findByIdAndUpdate(id, {
      name,
      slug: slugNorm,
      description: description || "",
    });
    return ApiResponse.success({ id }, "Company updated").send(res);
  }
  const created = await PlacementCompany.create({
    name,
    slug: slugNorm,
    description: description || "",
  });
  return ApiResponse.created({ id: created._id.toString() }, "Company created").send(res);
}

async function adminUpsertQuestion(req, res) {
  const { id, company_id, section, question_text, options, correct_index } = req.body;
  if (
    !company_id ||
    !mongoose.isValidObjectId(company_id) ||
    !section ||
    !question_text ||
    !Array.isArray(options) ||
    options.length < 2
  ) {
    return ApiResponse.badRequest("company_id, section, question_text, options[] required").send(
      res
    );
  }
  if (!["aptitude", "technical", "hr"].includes(section)) {
    return ApiResponse.badRequest("Invalid section").send(res);
  }
  if (id) {
    if (!mongoose.isValidObjectId(id)) {
      return ApiResponse.badRequest("Invalid question id").send(res);
    }
    await PlacementQuestion.findByIdAndUpdate(id, {
      companyId: company_id,
      section,
      questionText: question_text,
      options,
      correctIndex: correct_index,
    });
    return ApiResponse.success({ id }, "Question updated").send(res);
  }
  const q = await PlacementQuestion.create({
    companyId: company_id,
    section,
    questionText: question_text,
    options,
    correctIndex: correct_index,
  });
  return ApiResponse.created({ id: q._id.toString() }, "Question created").send(res);
}

async function adminListQuestions(req, res) {
  const filter = {};
  if (req.query.company_id && mongoose.isValidObjectId(req.query.company_id)) {
    filter.companyId = req.query.company_id;
  }
  const list = await PlacementQuestion.find(filter)
    .sort({ companyId: 1, section: 1, _id: 1 })
    .limit(500)
    .populate("companyId", "name")
    .lean();
  const rows = list.map((q) => ({
    id: q._id.toString(),
    company_id: q.companyId?._id?.toString(),
    company_name: q.companyId?.name,
    section: q.section,
    question_text: q.questionText,
    options_json: q.options,
    correct_index: q.correctIndex,
  }));
  return ApiResponse.success(rows, "Questions loaded").send(res);
}

module.exports = {
  listCompanies,
  getCompany,
  getQuizQuestions,
  submitQuiz,
  myAttempts,
  adminUpsertCompany,
  adminUpsertQuestion,
  adminListQuestions,
};
