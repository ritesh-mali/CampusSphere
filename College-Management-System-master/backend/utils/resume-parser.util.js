const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result?.text || "";
  } finally {
    await parser.destroy().catch(() => {});
  }
};

const extractTextFromFile = async (filePath, mimetype) => {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (mimetype === "application/pdf" || ext === ".pdf") {
    return extractPdfText(buffer);
  }

  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (mimetype === "application/msword" || ext === ".doc") {
    throw new Error(
      "Legacy .doc files are not supported. Please upload PDF or DOCX."
    );
  }

  throw new Error("Unsupported file format. Upload PDF or DOCX.");
};

module.exports = { extractTextFromFile };
