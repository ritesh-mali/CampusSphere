const axios = require("axios");
const ApiResponse = require("../utils/ApiResponse");
const ChatMessage = require("../models/chat-message.model");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

const getRecentHistory = async (userId, limit = 12) => {
  const docs = await ChatMessage.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.reverse().map((item) => ({
    role: item.role,
    content: item.content,
  }));
};

const sendChatMessageController = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return ApiResponse.badRequest("Message is required").send(res);
    }

    const openAIKey = process.env.OPENAI_API_KEY?.trim();
    const geminiKey =
      process.env.GEMINI_API_KEY?.trim() ||
      (openAIKey && openAIKey.startsWith("AIza") ? openAIKey : "");
    const isOpenRouterKey = Boolean(openAIKey && openAIKey.startsWith("sk-or-"));

    if (!openAIKey && !geminiKey) {
      return ApiResponse.internalServerError(
        "No AI provider key configured on server"
      ).send(res);
    }

    const cleanedMessage = message.trim();
    const userId = req.userId;

    await ChatMessage.create({
      userId,
      role: "user",
      content: cleanedMessage,
    });

    const history = await getRecentHistory(userId);

    const systemPrompt = `
You are a helpful AI assistant for a College Management System.
Keep answers concise, practical, and student-friendly.
If asked unrelated harmful content, refuse briefly and redirect to academics/productivity.
`.trim();

    let aiReply =
      "I could not generate a response right now. Please try again.";

    if (geminiKey) {
      const historyText = history
        .map(
          (item) =>
            `${item.role === "assistant" ? "Assistant" : "User"}: ${item.content}`
        )
        .join("\n");

      const geminiPrompt = `${systemPrompt}\n\nConversation so far:\n${historyText}`;
      const modelCandidates = [
        GEMINI_MODEL,
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
      ];

      let lastGeminiError = null;

      for (const modelName of modelCandidates) {
        try {
          const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
            {
              contents: [
                {
                  parts: [{ text: geminiPrompt }],
                },
              ],
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const parsedReply = geminiResponse?.data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            ?.trim();

          if (parsedReply) {
            aiReply = parsedReply;
            lastGeminiError = null;
            break;
          }
        } catch (providerError) {
          lastGeminiError = providerError;
        }
      }

      if (lastGeminiError) {
        throw lastGeminiError;
      }
    } else {
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
          messages: [{ role: "system", content: systemPrompt }, ...history],
        },
        { headers }
      );

      aiReply =
        completion?.data?.choices?.[0]?.message?.content?.trim() || aiReply;
    }

    await ChatMessage.create({
      userId,
      role: "assistant",
      content: aiReply,
    });

    return ApiResponse.success(
      { reply: aiReply },
      "Chat response generated successfully"
    ).send(res);
  } catch (error) {
    const providerMessage =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      "";
    const statusCode = error?.response?.status;

    console.error("Chat Controller Error:", error?.response?.data || error);

    if (statusCode === 429) {
      return ApiResponse.error(
        providerMessage ||
          "AI provider quota exceeded. Please check billing or try later.",
        429
      ).send(res);
    }

    if (statusCode === 401 || statusCode === 403) {
      return ApiResponse.error(
        providerMessage ||
          "AI provider authentication failed. Please verify API key.",
        502
      ).send(res);
    }

    return ApiResponse.internalServerError(
      providerMessage || "Failed to process chat request"
    ).send(res);
  }
};

module.exports = {
  sendChatMessageController,
};
