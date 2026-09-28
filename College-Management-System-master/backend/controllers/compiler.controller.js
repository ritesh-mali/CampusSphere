const axios = require("axios");
const ApiResponse = require("../utils/ApiResponse");
const StudentDetail = require("../models/details/student-details.model");

const LANGUAGE_CONFIG = {
  javascript: { language: "javascript" },
  python: { language: "python3" },
  cpp: { language: "cpp" },
  c: { language: "c" },
  java: { language: "java" },
};
const PAIZA_API_KEY = process.env.PAIZA_API_KEY || "guest";

const isComputerScienceBranch = (branchName = "") => {
  const normalized = String(branchName).toLowerCase();
  return normalized.includes("computer") || normalized.includes("cse");
};

const runCompilerController = async (req, res) => {
  try {
    const { language, code, stdin } = req.body;

    if (!language || !code) {
      return ApiResponse.badRequest("language and code are required").send(res);
    }

    const languageKey = String(language).toLowerCase();
    const config = LANGUAGE_CONFIG[languageKey];
    if (!config) {
      return ApiResponse.badRequest("Unsupported language").send(res);
    }

    const student = await StudentDetail.findById(req.userId)
      .populate("branchId", "name")
      .lean();

    if (!student) {
      return ApiResponse.forbidden("Only students can use compiler").send(res);
    }

    const branchName = student?.branchId?.name || "";
    if (!isComputerScienceBranch(branchName)) {
      return ApiResponse.forbidden(
        "Compiler access is only available for Computer Science department"
      ).send(res);
    }

    const sourceCode = String(code).replace(/\r\n/g, "\n");
    const inputText = String(stdin || "");

    const createResponse = await axios.post(
      "https://api.paiza.io/runners/create",
      {
        source_code: sourceCode,
        language: config.language,
        input: inputText,
        api_key: PAIZA_API_KEY,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const runnerId = createResponse?.data?.id;
    if (!runnerId) {
      return ApiResponse.internalServerError(
        "Compiler service did not return a job id"
      ).send(res);
    }

    let details = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const detailsResponse = await axios.get(
        "https://api.paiza.io/runners/get_details",
        {
          params: { id: runnerId, api_key: PAIZA_API_KEY },
        }
      );
      details = detailsResponse?.data;
      if (details?.status === "completed") break;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    if (!details || details.status !== "completed") {
      return ApiResponse.internalServerError(
        "Compiler timed out. Please try again."
      ).send(res);
    }

    const outputText = [
      details.build_stdout,
      details.build_stderr,
      details.stdout,
      details.stderr,
    ]
      .filter(Boolean)
      .join("\n")
      .trim();

    return ApiResponse.success(
      {
        output: outputText || "Program executed successfully with no output.",
        language: config.language,
      },
      "Code executed successfully"
    ).send(res);
  } catch (error) {
    const providerMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to execute code";
    console.error("Compiler Error:", error?.response?.data || error.message || error);
    return ApiResponse.internalServerError(providerMessage).send(res);
  }
};

module.exports = {
  runCompilerController,
};
