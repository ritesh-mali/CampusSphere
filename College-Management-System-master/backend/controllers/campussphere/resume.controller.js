const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ApiResponse = require("../../utils/ApiResponse");

const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === "win32" ? "py" : "python3");

function runResumeAnalysis(pdfPath) {
  const scriptPath = path.join(__dirname, "..", "..", "python_resume", "analyze_resume.py");
  return new Promise((resolve, reject) => {
    const args =
      PYTHON_BIN === "py" ? ["-3", scriptPath, "--file", pdfPath] : [scriptPath, "--file", pdfPath];
    const py = spawn(PYTHON_BIN, args, { windowsHide: true });
    let out = "";
    let err = "";
    py.stdout.on("data", (d) => {
      out += d.toString();
    });
    py.stderr.on("data", (d) => {
      err += d.toString();
    });
    py.on("close", (code) => {
      if (code !== 0 && !out.trim()) {
        return reject(new Error(err || `Python exited with ${code}`));
      }
      try {
        const jsonLine = out.trim().split("\n").filter(Boolean).pop();
        resolve(JSON.parse(jsonLine));
      } catch (e) {
        reject(new Error(`Invalid analyzer output: ${err || out}`));
      }
    });
  });
}

const analyzeResumeController = async (req, res) => {
  if (!req.file) {
    return ApiResponse.badRequest("Upload a PDF resume").send(res);
  }
  const pdfPath = req.file.path;
  try {
    const result = await runResumeAnalysis(pdfPath);
    if (result.error) {
      return ApiResponse.badRequest(result.error).send(res);
    }
    return ApiResponse.success(result, "Resume analyzed").send(res);
  } catch (e) {
    console.error("Resume analysis:", e.message);
    return ApiResponse.error(
      e.message || "Analysis failed — ensure Python 3 and pip install -r backend/python_resume/requirements.txt",
      500
    ).send(res);
  } finally {
    try {
      fs.unlinkSync(pdfPath);
    } catch (_) {
      /* ignore */
    }
  }
};

module.exports = { analyzeResumeController };
