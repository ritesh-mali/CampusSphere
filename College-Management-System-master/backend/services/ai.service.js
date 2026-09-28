const axios = require("axios");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const callAI = async (prompt, temperature = 0.5) => {
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
      process.env.OPENROUTER_APP_NAME || "Ashokrao mane group of institutions";
  }

  const completion = await axios.post(
    `${targetBaseUrl}/chat/completions`,
    {
      model: targetModel,
      temperature,
      messages: [{ role: "user", content: prompt }],
    },
    { headers }
  );

  return (
    completion?.data?.choices?.[0]?.message?.content?.trim() ||
    "Unable to generate response"
  );
};

const safeJsonParse = (value, fallback = null) => {
  try {
    const cleaned = String(value || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (error) {
    return fallback;
  }
};

module.exports = { callAI, safeJsonParse };
