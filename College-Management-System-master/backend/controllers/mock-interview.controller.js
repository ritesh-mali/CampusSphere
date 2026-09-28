const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { callAI, safeJsonParse } = require("../services/ai.service");
const { extractTextFromFile } = require("../utils/resume-parser.util");
const {
  heuristicParseResume,
  mergeParsedResume,
  toStringList,
} = require("../utils/resume-heuristics.util");
const ApiResponse = require("../utils/ApiResponse");
const ResumeProfile = require("../models/resume-profile.model");
const MockInterviewSession = require("../models/mock-interview-session.model");
const MockInterviewResult = require("../models/mock-interview-result.model");
const {
  INTERVIEW_ROLES,
  EXPERIENCE_LEVELS,
} = require("../constants/interview-roles");

const TOTAL_QUESTIONS = 20;
const QUESTION_TIME_SEC = 120;

const getRoleMeta = (roleId) =>
  INTERVIEW_ROLES.find((r) => r.id === roleId) || {
    id: roleId,
    label: roleId,
    category: "general",
  };

const buildResumeExtractionPrompt = (rawText, heuristicHint) => `
You are an expert resume parser. Extract ALL skills and ALL projects from this resume.

Rules:
- "skills": every tool, language, framework, soft skill listed (min 5 if present in resume)
- "technologies": programming languages, frameworks, databases, cloud tools only
- "projects": EVERY project with title + 1-line description. Use format "Project Name — what it does / tech used"
  Include academic, personal, internship, and capstone projects. Do NOT leave projects empty if any exist in text.
- "experience": job/internship entries as "Role @ Company — duration or highlights"
- Return valid JSON only, no markdown

${heuristicHint ? `Heuristic pre-scan (merge & improve, do not discard):\n${heuristicHint}\n` : ""}

JSON schema:
{
  "name":"",
  "skills":["skill1","skill2"],
  "technologies":["tech1"],
  "projects":["Project A — built X using React and Node","Project B — ..."],
  "experience":["Role @ Company — details"],
  "education":["Degree — College — year"],
  "certifications":["cert name"],
  "aiSummary":"2-3 sentence professional summary",
  "atsScore":75
}

Resume text:
${rawText.slice(0, 14000)}
`.trim();

const buildQuestionsPrompt = ({
  roleLabel,
  experienceLevel,
  parsed,
  previousQuestions,
  weakAreas,
}) => `
You are a senior technical interviewer.
Generate exactly ${TOTAL_QUESTIONS} unique mock interview questions for a ${experienceLevel} candidate applying as ${roleLabel}.

Resume profile:
- Name: ${parsed.name || "Candidate"}
- Skills: ${(parsed.skills || []).join(", ")}
- Technologies: ${(parsed.technologies || []).join(", ")}
- Projects: ${(parsed.projects || []).slice(0, 8).join(" | ")}
- Experience: ${(parsed.experience || []).slice(0, 6).join(" | ")}
- Education: ${(parsed.education || []).join(", ")}
- Certifications: ${(parsed.certifications || []).join(", ")}

Requirements:
- Mix: technical, HR, project-based, problem-solving, behavioral, scenario-based
- Personalize using resume skills, projects, and tech stack
- Difficulty increases gradually (questions 1-5 easy, 6-12 medium, 13-20 hard)
- No duplicate or near-duplicate questions
- Avoid these already used questions: ${JSON.stringify(previousQuestions.slice(-40))}
${weakAreas?.length ? `- Focus more on weak areas: ${weakAreas.join(", ")}` : ""}

Return strict JSON:
{
  "questions":[
    {"text":"question","type":"technical|hr|project|problem-solving|behavioral|scenario","difficulty":1}
  ]
}
`.trim();

const normalizeQuestions = (items) => {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set();
  const output = [];

  for (const item of list) {
    const text = String(item?.text || item || "").trim();
    if (text.length < 12) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      text,
      type: [
        "technical",
        "hr",
        "project",
        "problem-solving",
        "behavioral",
        "scenario",
      ].includes(item?.type)
        ? item.type
        : "technical",
      difficulty: Math.min(5, Math.max(1, Number(item?.difficulty) || 1)),
    });
    if (output.length >= TOTAL_QUESTIONS) break;
  }
  return output;
};

const fallbackQuestions = (roleLabel, parsed) => {
  const skills = parsed.skills?.slice(0, 3).join(", ") || "your core skills";
  const project = parsed.projects?.[0] || "a recent project";
  const templates = [
    `Tell me about yourself and why you are a fit for ${roleLabel}.`,
    `Walk me through ${project} and your specific contributions.`,
    `Explain a challenging bug you fixed using ${skills}.`,
    `How do you prioritize tasks when deadlines overlap?`,
    `Describe a time you received critical feedback and how you responded.`,
    `What is your approach to learning a new technology quickly?`,
    `How would you design a scalable API for a student portal?`,
    `Explain time vs space complexity with a real example.`,
    `What trade-offs did you consider in ${project}?`,
    `How do you ensure code quality in team projects?`,
    `Describe a conflict in a team and how you resolved it.`,
    `What metrics would you track for a feature you shipped?`,
    `How do you handle production incidents under pressure?`,
    `Explain a system design for real-time notifications.`,
    `What security practices do you follow in web apps?`,
    `How would you test a critical payment workflow?`,
    `Where do you see yourself in 3 years as a ${roleLabel}?`,
    `What is your biggest technical weakness and improvement plan?`,
    `Scenario: deadline moved up by 50% — what do you do?`,
    `Why should we hire you over other candidates?`,
  ];
  return templates.map((text, i) => ({
    text,
    type: i % 6 === 0 ? "hr" : "technical",
    difficulty: Math.min(5, 1 + Math.floor(i / 4)),
  }));
};

const uploadResumeController = async (req, res) => {
  try {
    if (!req.file?.path) {
      return ApiResponse.badRequest("Resume file is required").send(res);
    }

    const rawText = await extractTextFromFile(
      req.file.path,
      req.file.mimetype
    );

    if (!rawText.trim()) {
      return ApiResponse.badRequest(
        "Could not extract text from resume. Use a text-based PDF or DOCX."
      ).send(res);
    }

    const heuristic = heuristicParseResume(rawText);
    const heuristicHint = JSON.stringify({
      skills: heuristic.skills.slice(0, 20),
      projects: heuristic.projects.slice(0, 10),
      technologies: heuristic.technologies.slice(0, 15),
    });

    let aiParsed = {
      name: "",
      skills: [],
      technologies: [],
      projects: [],
      experience: [],
      education: [],
      certifications: [],
    };
    let aiSummary = "";
    let atsScore = 0;

    try {
      const aiText = await callAI(
        buildResumeExtractionPrompt(rawText, heuristicHint),
        0.25
      );
      const data = safeJsonParse(aiText, {});
      aiParsed = {
        name: String(data.name || "").trim(),
        skills: toStringList(data.skills),
        technologies: toStringList(data.technologies),
        projects: toStringList(data.projects),
        experience: toStringList(data.experience),
        education: toStringList(data.education),
        certifications: toStringList(data.certifications),
      };
      aiSummary = String(data.aiSummary || "").trim();
      atsScore = Math.max(0, Math.min(100, Number(data.atsScore) || 0));
    } catch (error) {
      console.error("Resume AI parse fallback:", error?.message);
    }

    const parsed = mergeParsedResume(aiParsed, heuristic);

    if (!aiSummary) {
      aiSummary = `Candidate with skills in ${parsed.skills.slice(0, 5).join(", ") || "various areas"}${
        parsed.projects.length
          ? ` and ${parsed.projects.length} project(s) including ${parsed.projects[0].slice(0, 60)}`
          : ""
      }.`;
    }
    if (!atsScore) {
      atsScore = Math.min(
        100,
        Math.round(
          parsed.skills.length * 2 +
            parsed.projects.length * 5 +
            parsed.experience.length * 4 +
            (parsed.education.length ? 10 : 0)
        )
      );
    }

    const profile = await ResumeProfile.create({
      userId: req.userId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      rawText: rawText.slice(0, 50000),
      parsed,
      aiSummary,
      atsScore,
    });

    return ApiResponse.success(
      {
        resumeId: profile._id,
        parsed: profile.parsed,
        aiSummary: profile.aiSummary,
        atsScore: profile.atsScore,
      },
      "Resume analyzed successfully"
    ).send(res);
  } catch (error) {
    console.error("Upload resume error:", error);
    return ApiResponse.internalServerError(
      error.message || "Failed to analyze resume"
    ).send(res);
  }
};

const getLatestResumeController = async (req, res) => {
  const profile = await ResumeProfile.findOne({ userId: req.userId })
    .sort({ createdAt: -1 })
    .lean();

  if (!profile) {
    return ApiResponse.notFound("No resume uploaded yet").send(res);
  }

  return ApiResponse.success({
    resumeId: profile._id,
    parsed: profile.parsed,
    aiSummary: profile.aiSummary,
    atsScore: profile.atsScore,
    fileName: profile.fileName,
    createdAt: profile.createdAt,
  }).send(res);
};

const getRolesController = async (_req, res) => {
  return ApiResponse.success({
    roles: INTERVIEW_ROLES,
    experienceLevels: EXPERIENCE_LEVELS,
    questionTimeSec: QUESTION_TIME_SEC,
    totalQuestions: TOTAL_QUESTIONS,
  }).send(res);
};

const startMockInterviewController = async (req, res) => {
  try {
    const { role, experienceLevel = "fresher", resumeId } = req.body || {};

    if (!role) {
      return ApiResponse.badRequest("Interview role is required").send(res);
    }

    const roleMeta = getRoleMeta(role);
    let resumeProfile = null;

    if (resumeId) {
      resumeProfile = await ResumeProfile.findOne({
        _id: resumeId,
        userId: req.userId,
      });
    } else {
      resumeProfile = await ResumeProfile.findOne({ userId: req.userId }).sort({
        createdAt: -1,
      });
    }

    if (!resumeProfile) {
      return ApiResponse.badRequest(
        "Upload and analyze a resume before starting the interview"
      ).send(res);
    }

    const pastSessions = await MockInterviewSession.find({
      userId: req.userId,
      role,
    })
      .select("questionHistory")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const previousQuestions = pastSessions.flatMap((s) => s.questionHistory || []);

    let questions = [];
    try {
      const aiText = await callAI(
        buildQuestionsPrompt({
          roleLabel: roleMeta.label,
          experienceLevel,
          parsed: resumeProfile.parsed,
          previousQuestions,
          weakAreas: [],
        }),
        0.65
      );
      const parsed = safeJsonParse(aiText, {});
      questions = normalizeQuestions(parsed?.questions);
    } catch (error) {
      console.error("Question generation fallback:", error?.message);
    }

    if (questions.length < TOTAL_QUESTIONS) {
      const fallback = fallbackQuestions(roleMeta.label, resumeProfile.parsed);
      const seen = new Set(questions.map((q) => q.text.toLowerCase()));
      for (const q of fallback) {
        if (questions.length >= TOTAL_QUESTIONS) break;
        if (!seen.has(q.text.toLowerCase())) {
          questions.push(q);
          seen.add(q.text.toLowerCase());
        }
      }
    }

    questions = questions.slice(0, TOTAL_QUESTIONS);

    const session = await MockInterviewSession.create({
      userId: req.userId,
      resumeProfileId: resumeProfile._id,
      role,
      roleLabel: roleMeta.label,
      experienceLevel,
      questions,
      questionHistory: questions.map((q) => q.text),
      status: "active",
      currentIndex: 0,
      progressPercent: 0,
    });

    return ApiResponse.success(
      {
        sessionId: session._id,
        role: session.role,
        roleLabel: session.roleLabel,
        experienceLevel: session.experienceLevel,
        totalQuestions: questions.length,
        questionTimeSec: QUESTION_TIME_SEC,
        currentIndex: 0,
        question: questions[0],
        resumeSummary: resumeProfile.aiSummary,
        atsScore: resumeProfile.atsScore,
      },
      "Mock interview started"
    ).send(res);
  } catch (error) {
    console.error("Start mock interview error:", error);
    return ApiResponse.internalServerError("Failed to start interview").send(
      res
    );
  }
};

const submitAnswerController = async (req, res) => {
  try {
    const {
      sessionId,
      answer,
      durationSec = 0,
      skipped = false,
      retried = false,
      emotionSnapshot,
    } = req.body || {};

    const session = await MockInterviewSession.findOne({
      _id: sessionId,
      userId: req.userId,
      status: "active",
    });

    if (!session) {
      return ApiResponse.notFound("Active interview session not found").send(res);
    }

    const index = session.currentIndex;
    const currentQ = session.questions[index];
    if (!currentQ) {
      return ApiResponse.badRequest("Interview already completed").send(res);
    }

    session.answers.push({
      question: currentQ.text,
      answer: String(answer || "").trim() || (skipped ? "[Skipped]" : ""),
      durationSec: Math.max(0, Number(durationSec) || 0),
      skipped: Boolean(skipped),
      retried: Boolean(retried),
    });

    if (emotionSnapshot) {
      session.markModified("answers");
    }

    const nextIndex = index + 1;
    session.currentIndex = nextIndex;
    session.progressPercent = Math.round(
      (nextIndex / session.questions.length) * 100
    );

    const isComplete = nextIndex >= session.questions.length;

    if (isComplete) {
      session.status = "completed";
      await session.save();
      return ApiResponse.success({
        completed: true,
        progressPercent: 100,
        message: "All questions answered. Submit for AI analysis.",
      }).send(res);
    }

    await session.save();

    let followUp = null;
    if (!skipped && answer?.trim()?.length > 20 && nextIndex % 5 === 0) {
      try {
        const followPrompt = `
Based on this interview answer, generate ONE short follow-up probe question (max 25 words).
Return JSON: {"followUp":"..."}
Role: ${session.roleLabel}
Q: ${currentQ.text}
A: ${answer}
`.trim();
        const aiText = await callAI(followPrompt, 0.4);
        followUp = safeJsonParse(aiText, {})?.followUp || null;
      } catch (e) {
        /* optional */
      }
    }

    return ApiResponse.success({
      completed: false,
      currentIndex: nextIndex,
      progressPercent: session.progressPercent,
      question: session.questions[nextIndex],
      followUp,
    }).send(res);
  } catch (error) {
    console.error("Submit answer error:", error);
    return ApiResponse.internalServerError("Failed to submit answer").send(res);
  }
};

const completeInterviewController = async (req, res) => {
  try {
    const { sessionId, behaviorMetrics, emotionMetrics } = req.body || {};

    const session = await MockInterviewSession.findOne({
      _id: sessionId,
      userId: req.userId,
    });

    if (!session) {
      return ApiResponse.notFound("Interview session not found").send(res);
    }

    const resume = await ResumeProfile.findById(session.resumeProfileId).lean();
    const answersPayload = session.answers.map((a) => ({
      question: a.question,
      answer: a.answer,
    }));

    const evalPrompt = `
You are an expert interview coach. Evaluate this complete mock interview.

Role: ${session.roleLabel}
Experience: ${session.experienceLevel}
Resume skills: ${(resume?.parsed?.skills || []).join(", ")}

Return strict JSON:
{
  "scores":{
    "overall":0,"technical":0,"communication":0,"confidence":0,"grammar":0,
    "fluency":0,"relevance":0,"problemSolving":0,"keywordMatch":0,"professionalism":0,
    "atsCompatibility":0,"interviewReadiness":0
  },
  "emotionMetrics":{
    "confidence":0,"nervousness":0,"eyeContact":0,"attention":0,
    "dominantExpression":"","behavioralSummary":""
  },
  "strengths":[],"weaknesses":[],"improvementSuggestions":[],
  "missingConcepts":[],"learningResources":[],"improvementRoadmap":[],
  "overallFeedback":"",
  "items":[
    {
      "question":"","answer":"",
      "analysis":{
        "score":0,"feedback":"","grammar":0,"relevance":0,"confidence":0,
        "fillerWords":0,"speakingPace":"normal","keywordsMatched":[]
      }
    }
  ],
  "chartData":{"labels":["Q1"],"technical":[0],"communication":[0]}
}

Candidate answers:
${JSON.stringify(answersPayload)}

Webcam behavior metrics:
${JSON.stringify(behaviorMetrics || {})}

Client emotion metrics:
${JSON.stringify(emotionMetrics || {})}
`.trim();

    let evaluation = null;
    try {
      const aiText = await callAI(evalPrompt, 0.35);
      evaluation = safeJsonParse(aiText, null);
    } catch (error) {
      console.error("Evaluation AI fallback:", error?.message);
    }

    const defaultScores = {
      overall: 65,
      technical: 65,
      communication: 65,
      confidence: 65,
      grammar: 65,
      fluency: 65,
      relevance: 65,
      problemSolving: 65,
      keywordMatch: 60,
      professionalism: 65,
      atsCompatibility: resume?.atsScore || 60,
      interviewReadiness: 62,
    };

    const scores = { ...defaultScores, ...(evaluation?.scores || {}) };
    Object.keys(scores).forEach((k) => {
      scores[k] = Math.max(0, Math.min(100, Number(scores[k]) || 0));
    });

    const items = evaluation?.items?.length
      ? evaluation.items
      : session.answers.map((a) => ({
          question: a.question,
          answer: a.answer,
          analysis: {
            score: 60,
            feedback: "Practice structuring answers with STAR method.",
            grammar: 60,
            relevance: 60,
            confidence: 60,
            fillerWords: 0,
            speakingPace: "normal",
            keywordsMatched: [],
          },
        }));

    const result = await MockInterviewResult.create({
      userId: req.userId,
      sessionId: session._id,
      role: session.role,
      scores,
      emotionMetrics: {
        ...{
          confidence: 60,
          nervousness: 40,
          eyeContact: 60,
          attention: 65,
          dominantExpression: "neutral",
          behavioralSummary: "Maintain steady eye contact and calmer pacing.",
        },
        ...(evaluation?.emotionMetrics || {}),
        ...(emotionMetrics || {}),
      },
      behaviorMetrics: behaviorMetrics || {},
      strengths: evaluation?.strengths || ["Clear willingness to learn"],
      weaknesses: evaluation?.weaknesses || ["Needs deeper technical examples"],
      improvementSuggestions: evaluation?.improvementSuggestions || [
        "Practice 2-minute structured answers daily.",
      ],
      missingConcepts: evaluation?.missingConcepts || [],
      learningResources: evaluation?.learningResources || [
        "LeetCode patterns for your stack",
        "Cracking the Coding Interview",
      ],
      improvementRoadmap: evaluation?.improvementRoadmap || [
        "Week 1: Revise core CS fundamentals",
        "Week 2: Mock interviews with timer",
        "Week 3: Project deep-dives with metrics",
      ],
      overallFeedback:
        evaluation?.overallFeedback ||
        "Solid effort. Focus on concise, example-driven responses.",
      answers: items,
      chartData: evaluation?.chartData || {
        labels: items.map((_, i) => `Q${i + 1}`),
        technical: items.map((it) => it.analysis?.score || 60),
        communication: items.map((it) => it.analysis?.relevance || 60),
      },
    });

    session.status = "completed";
    await session.save();

    return ApiResponse.success(
      {
        resultId: result._id,
        sessionId: session._id,
        scores: result.scores,
        emotionMetrics: result.emotionMetrics,
        behaviorMetrics: result.behaviorMetrics,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        improvementSuggestions: result.improvementSuggestions,
        missingConcepts: result.missingConcepts,
        learningResources: result.learningResources,
        improvementRoadmap: result.improvementRoadmap,
        overallFeedback: result.overallFeedback,
        answers: result.answers,
        chartData: result.chartData,
        role: session.roleLabel,
        createdAt: result.createdAt,
      },
      "Interview analysis complete"
    ).send(res);
  } catch (error) {
    console.error("Complete interview error:", error);
    const msg =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to complete interview";
    return ApiResponse.internalServerError(msg).send(res);
  }
};

const getHistoryController = async (req, res) => {
  const results = await MockInterviewResult.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .select(
      "scores role overallFeedback createdAt sessionId improvementRoadmap"
    )
    .lean();

  return ApiResponse.success({ history: results }).send(res);
};

const getResultController = async (req, res) => {
  const result = await MockInterviewResult.findOne({
    _id: req.params.resultId,
    userId: req.userId,
  }).lean();

  if (!result) {
    return ApiResponse.notFound("Result not found").send(res);
  }

  return ApiResponse.success({ result }).send(res);
};

const downloadReportPdfController = async (req, res) => {
  const result = await MockInterviewResult.findOne({
    _id: req.params.resultId,
    userId: req.userId,
  }).lean();

  if (!result) {
    return ApiResponse.notFound("Result not found").send(res);
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="interview-report-${result._id}.pdf"`
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text("AI Mock Interview Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Role: ${result.role}`);
  doc.text(`Date: ${new Date(result.createdAt).toLocaleString()}`);
  doc.moveDown();
  doc.text(`Overall Score: ${result.scores?.overall}/100`);
  doc.text(`Technical: ${result.scores?.technical}`);
  doc.text(`Communication: ${result.scores?.communication}`);
  doc.text(`Confidence: ${result.scores?.confidence}`);
  doc.text(`Interview Readiness: ${result.scores?.interviewReadiness}%`);
  doc.moveDown();
  doc.fontSize(14).text("Overall Feedback");
  doc.fontSize(11).text(result.overallFeedback || "");
  doc.moveDown();
  doc.fontSize(14).text("Strengths");
  (result.strengths || []).forEach((s) => doc.fontSize(11).text(`• ${s}`));
  doc.moveDown();
  doc.fontSize(14).text("Improvement Roadmap");
  (result.improvementRoadmap || []).forEach((s) =>
    doc.fontSize(11).text(`• ${s}`)
  );

  doc.end();
};

module.exports = {
  uploadResumeController,
  getLatestResumeController,
  getRolesController,
  startMockInterviewController,
  submitAnswerController,
  completeInterviewController,
  getHistoryController,
  getResultController,
  downloadReportPdfController,
};
