const axios = require("axios");
const ApiResponse = require("../utils/ApiResponse");
const InterviewSession = require("../models/interview-session.model");
const InterviewResult = require("../models/interview-result.model");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const departmentFallbackQuestions = {
  cse: [
    "Explain time complexity with an example from your coding experience.",
    "How would you design a simple student result management API?",
    "Describe one project where you used debugging to solve a major issue.",
    "What are database indexing basics and why are they useful?",
    "Tell me about yourself and why you chose software engineering.",
  ],
  mechanical: [
    "Explain the difference between stress and strain with practical use.",
    "How does a four-stroke engine work?",
    "Describe a mechanical design project where you solved a real constraint.",
    "What is the purpose of tolerance in manufacturing drawings?",
    "Why should we hire you for a graduate trainee mechanical role?",
  ],
  civil: [
    "What are the key checks before concrete pouring at site?",
    "Explain the role of curing in concrete quality.",
    "Describe one challenge you faced in surveying or estimation work.",
    "What is the difference between working stress and limit state methods?",
    "Why are you suitable for a site engineer role?",
  ],
  electrical: [
    "Explain power factor and why correction is required.",
    "What are the common causes of transformer losses?",
    "Describe a lab/project where you troubleshot an electrical issue.",
    "What safety precautions are essential while working on panels?",
    "Why should we hire you for an electrical engineering role?",
  ],
  default: [
    "Tell me about yourself and your academic background.",
    "Describe one project where you solved a difficult technical problem.",
    "How do you prioritize tasks when multiple deadlines are close?",
    "What are your strongest technical skills for your domain?",
    "Why should we hire you for a fresher role?",
  ],
};

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const callAI = async (prompt) => {
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    (openAIKey && openAIKey.startsWith("AIza") ? openAIKey : "");
  const isOpenRouterKey = Boolean(openAIKey && openAIKey.startsWith("sk-or-"));

  if (geminiKey) {
    const modelCandidates = [
      GEMINI_MODEL,
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
    ];

    let lastError = null;
    for (const modelName of modelCandidates) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
          },
          { headers: { "Content-Type": "application/json" } }
        );

        const text = response?.data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

        if (text) return text;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Gemini response is empty");
  }

  if (!openAIKey) {
    throw new Error("No AI provider key configured");
  }

  const targetBaseUrl = isOpenRouterKey
    ? "https://openrouter.ai/api/v1"
    : OPENAI_BASE_URL;
  const targetModel = isOpenRouterKey
    ? process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
    : OPENAI_MODEL;

  const headers = {
    Authorization: `Bearer ${openAIKey}`,
    "Content-Type": "application/json",
  };

  if (isOpenRouterKey) {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_SITE_URL || "http://localhost:5173";
    headers["X-Title"] =
      process.env.OPENROUTER_APP_NAME || "College Management System";
  }

  const completion = await axios.post(
    `${targetBaseUrl}/chat/completions`,
    {
      model: targetModel,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    },
    { headers }
  );

  return (
    completion?.data?.choices?.[0]?.message?.content?.trim() ||
    "Unable to generate response"
  );
};

const normalizeQuestions = (items, limit = 5) =>
  (Array.isArray(items) ? items : [])
    .map((q) => String(q || "").trim())
    .filter((q) => q.length >= 8)
    .slice(0, limit);

const validateCustomQuestions = async (customQuestions, department) => {
  if (!customQuestions?.length) return [];

  const prompt = `
You are reviewing interview questions for ${department || "general"} department students.
Polish grammar and make each question clear and interview-ready.
Keep question meaning same.
Return strict JSON:
{"questions":["q1","q2","q3"]}

Input questions:
${JSON.stringify(customQuestions)}
`.trim();

  try {
    const aiText = await callAI(prompt);
    const parsed = safeJsonParse(aiText, null);
    return normalizeQuestions(parsed?.questions, 5);
  } catch (error) {
    console.error("Custom question validation fallback:", error?.response?.data || error);
    return normalizeQuestions(customQuestions, 5);
  }
};

const startInterviewController = async (req, res) => {
  try {
    const { department, customQuestions } = req.body || {};
    const normalizedDepartment = String(department || "")
      .trim()
      .toLowerCase();
    const userCustomQuestions = normalizeQuestions(customQuestions, 5);
    const approvedCustomQuestions = await validateCustomQuestions(
      userCustomQuestions,
      normalizedDepartment
    );

    const prompt = `
Generate 5 mock interview questions for a final-year ${
      normalizedDepartment || "engineering"
    } student.
Mix technical and HR questions. Keep them suitable for the department.
Return strict JSON only in this format:
{"questions":["q1","q2","q3","q4","q5"]}
`.trim();

    const departmentFallback =
      departmentFallbackQuestions[normalizedDepartment] ||
      departmentFallbackQuestions.default;

    let aiQuestions = [...departmentFallback];
    try {
      const aiText = await callAI(prompt);
      const parsed = safeJsonParse(aiText, null);
      const normalized = normalizeQuestions(parsed?.questions, 5);
      if (normalized.length) {
        aiQuestions = normalized;
      }
    } catch (error) {
      console.error("Interview start AI fallback:", error?.response?.data || error);
    }

    const mergedQuestions = [...approvedCustomQuestions, ...aiQuestions].slice(0, 5);
    const questions = mergedQuestions.length ? mergedQuestions : departmentFallback;

    const session = await InterviewSession.create({
      userId: req.userId,
      questions,
      status: "active",
    });

    return ApiResponse.success(
      {
        interviewId: session._id,
        questions: session.questions,
        approvedCustomQuestions,
      },
      "Interview started successfully"
    ).send(res);
  } catch (error) {
    console.error("Start Interview Error:", error?.response?.data || error);
    return ApiResponse.internalServerError("Failed to start interview").send(res);
  }
};

const submitInterviewController = async (req, res) => {
  try {
    const { interviewId, answers, behaviorMetrics } = req.body;

    if (!interviewId || !Array.isArray(answers) || answers.length === 0) {
      return ApiResponse.badRequest(
        "interviewId and answers are required"
      ).send(res);
    }

    const session = await InterviewSession.findOne({
      _id: interviewId,
      userId: req.userId,
      status: "active",
    });

    if (!session) {
      return ApiResponse.notFound("Interview session not found").send(res);
    }

    const normalizedAnswers = answers
      .map((item, index) => ({
        question: String(
          item?.question || session.questions[index] || "Interview question"
        ).trim(),
        answer: String(item?.answer || "").trim(),
      }))
      .filter((item) => item.answer);

    if (!normalizedAnswers.length) {
      return ApiResponse.badRequest("At least one answer is required").send(res);
    }

    const evaluationPrompt = `
You are an interview evaluator.
Analyze each answer using:
- grammar (0-100)
- relevance (0-100)
- confidence (0-100)
- score (0-100)
- feedback (short paragraph)
- tips (array of 2 short strings)

Then provide:
- overallScore (0-100)
- overallFeedback
- improvementTips (array of 3 strings)

Return strict JSON only in this format:
{
  "items":[
    {
      "question":"...",
      "analysis":{
        "grammar":70,
        "relevance":75,
        "confidence":68,
        "score":71,
        "feedback":"...",
        "tips":["...","..."]
      }
    }
  ],
  "overallScore":72,
  "overallFeedback":"...",
  "improvementTips":["...","...","..."]
}

Candidate responses:
${JSON.stringify(normalizedAnswers)}

Behavior metrics from automated session:
${JSON.stringify(
  behaviorMetrics || {
    faceDetectedRatio: 0,
    tabSwitchCount: 0,
    speechSegments: 0,
    avgAnswerDurationSec: 0,
    warnings: [],
  }
)}

Use behavior metrics to slightly adjust confidence scoring and provide practical interview discipline tips.
`.trim();

    let parsedEvaluation;
    try {
      const aiText = await callAI(evaluationPrompt);
      parsedEvaluation = safeJsonParse(aiText, null);
    } catch (error) {
      console.error(
        "Interview submit AI parse fallback:",
        error?.response?.data || error
      );
    }

    const evaluatedItems =
      parsedEvaluation?.items?.length > 0
        ? parsedEvaluation.items
        : normalizedAnswers.map((item) => ({
            question: item.question,
            analysis: {
              grammar: 60,
              relevance: 60,
              confidence: 60,
              score: 60,
              feedback:
                "Your answer is understandable but needs more structure and examples.",
              tips: [
                "Use a clear beginning-middle-end structure.",
                "Add one real example from your coursework/project.",
              ],
            },
          }));

    const answersWithAnalysis = normalizedAnswers.map((item, index) => {
      const aiItem = evaluatedItems[index] || {};
      const analysis = aiItem.analysis || {};

      return {
        question: item.question,
        answer: item.answer,
        analysis: {
          grammar: Math.max(0, Math.min(100, Number(analysis.grammar) || 60)),
          relevance: Math.max(
            0,
            Math.min(100, Number(analysis.relevance) || 60)
          ),
          confidence: Math.max(
            0,
            Math.min(100, Number(analysis.confidence) || 60)
          ),
          score: Math.max(0, Math.min(100, Number(analysis.score) || 60)),
          feedback:
            String(analysis.feedback || "").trim() ||
            "Good effort. Improve clarity and add concrete examples.",
          tips: Array.isArray(analysis.tips)
            ? analysis.tips.map((tip) => String(tip || "").trim()).filter(Boolean)
            : [],
        },
      };
    });

    const computedOverall = Math.round(
      answersWithAnalysis.reduce((sum, item) => sum + item.analysis.score, 0) /
        answersWithAnalysis.length
    );

    const result = await InterviewResult.create({
      userId: req.userId,
      sessionId: session._id,
      answers: answersWithAnalysis,
      overallScore: Math.max(
        0,
        Math.min(100, Number(parsedEvaluation?.overallScore) || computedOverall)
      ),
      feedback:
        String(parsedEvaluation?.overallFeedback || "").trim() ||
        "Good attempt. Keep practicing concise and example-driven answers.",
      improvementTips: Array.isArray(parsedEvaluation?.improvementTips)
        ? parsedEvaluation.improvementTips
            .map((tip) => String(tip || "").trim())
            .filter(Boolean)
        : [
            "Practice speaking answers aloud before interviews.",
            "Use STAR method for behavioral questions.",
            "Revise core concepts and common interview topics.",
          ],
      behaviorMetrics: {
        faceDetectedRatio: Math.max(
          0,
          Math.min(1, Number(behaviorMetrics?.faceDetectedRatio) || 0)
        ),
        tabSwitchCount: Math.max(0, Number(behaviorMetrics?.tabSwitchCount) || 0),
        speechSegments: Math.max(0, Number(behaviorMetrics?.speechSegments) || 0),
        avgAnswerDurationSec: Math.max(
          0,
          Number(behaviorMetrics?.avgAnswerDurationSec) || 0
        ),
        warnings: Array.isArray(behaviorMetrics?.warnings)
          ? behaviorMetrics.warnings
              .map((item) => String(item || "").trim())
              .filter(Boolean)
          : [],
      },
    });

    session.status = "completed";
    await session.save();

    return ApiResponse.success(
      {
        resultId: result._id,
        score: result.overallScore,
        feedback: result.feedback,
        improvementTips: result.improvementTips,
        answers: result.answers,
        behaviorMetrics: result.behaviorMetrics,
      },
      "Interview submitted successfully"
    ).send(res);
  } catch (error) {
    const providerMessage =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      "";
    const statusCode = error?.response?.status;

    console.error("Submit Interview Error:", error?.response?.data || error);

    if (statusCode === 429) {
      return ApiResponse.error(
        providerMessage || "AI provider quota exceeded. Try later.",
        429
      ).send(res);
    }

    return ApiResponse.internalServerError(
      providerMessage || "Failed to submit interview"
    ).send(res);
  }
};

module.exports = {
  startInterviewController,
  submitInterviewController,
};
