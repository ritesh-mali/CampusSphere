import React, { useState } from "react";
import Heading from "../components/Heading";
import CustomButton from "../components/CustomButton";
import toast from "react-hot-toast";
import { analyzeResumePdf } from "./api";
import "../styles/sections/section-resume-analyzer.css";

/**
 * Upload PDF → Node forwards to Python NLP script → show score + suggestions.
 */
const ResumeAnalyzerPanel = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onAnalyze = async () => {
    if (!file) {
      toast.error("Choose a PDF resume first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await analyzeResumePdf(file);
      if (data.success) {
        setResult(data.data);
        toast.success("Analysis complete");
      } else {
        toast.error(data.message || "Failed");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const score = result?.overall_score ?? 0;

  return (
    <div className="section-resume-analyzer w-full max-w-3xl mx-auto py-4 px-2">
      <Heading title="Resume Analyzer" />
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-6 dark:text-slate-400">
        Upload a PDF resume. Python (NLTK + heuristics) checks grammar patterns, compares
        skills to a built-in keyword list, and estimates a simple ATS-style keyword score.
      </p>

      <div className="rounded-2xl border border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 dark:text-slate-300">
          Resume (PDF)
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-600 dark:text-gray-300 dark:text-slate-400"
        />
        <CustomButton className="mt-4" onClick={onAnalyze} disabled={loading}>
          {loading ? "Analyzing…" : "Analyze resume"}
        </CustomButton>
      </div>

      {result && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-blue-50/80 dark:from-gray-900 dark:to-gray-800 p-6 shadow-md space-y-4 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Analysis result
          </h3>

          <div>
            <div className="flex justify-between text-sm mb-1 text-gray-700 dark:text-gray-300 dark:text-slate-300">
              <span>Overall score</span>
              <span className="font-bold">{score} / 100</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <ScoreChip label="ATS keywords" value={result.ats_keyword_score} />
            <ScoreChip label="Grammar / style" value={result.grammar_score} />
            <ScoreChip label="Skills coverage" value={result.skills_coverage_score} />
          </div>

          {result.suggestions?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Suggestions
              </h4>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1 dark:text-slate-300">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.missing_keywords?.length > 0 && (
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Missing keywords (add if they apply to you)
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.slice(0, 24).map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.grammar_issues?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Grammar / formatting notes
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 dark:text-slate-300">
                {result.grammar_issues.slice(0, 10).map((g, i) => (
                  <li key={i} className="border-l-2 border-blue-400 pl-2">
                    {g.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function ScoreChip({ label, value }) {
  return (
    <div className="rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 p-3 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-slate-400">{label}</div>
      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{value}</div>
    </div>
  );
}

export default ResumeAnalyzerPanel;
