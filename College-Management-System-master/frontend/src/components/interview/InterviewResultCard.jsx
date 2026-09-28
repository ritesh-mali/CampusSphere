import React from "react";

const scoreBadgeClass = (score) => {
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 60) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const InterviewResultCard = ({ item, index }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-800 dark:text-slate-100">Q{index + 1}</h3>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${scoreBadgeClass(
            item.analysis.score
          )}`}
        >
          Score: {item.analysis.score}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-700 dark:text-slate-300">
        <span className="font-semibold">Question:</span> {item.question}
      </p>
      <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
        <span className="font-semibold">Your answer:</span> {item.answer}
      </p>
      <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
        <span className="font-semibold">Feedback:</span> {item.analysis.feedback}
      </p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-700 dark:text-slate-300">
        <div className="rounded-md bg-gray-100 px-2 py-1 dark:bg-slate-900/40">
          Grammar: {item.analysis.grammar}
        </div>
        <div className="rounded-md bg-gray-100 px-2 py-1 dark:bg-slate-900/40">
          Relevance: {item.analysis.relevance}
        </div>
        <div className="rounded-md bg-gray-100 px-2 py-1 dark:bg-slate-900/40">
          Confidence: {item.analysis.confidence}
        </div>
      </div>

      {item.analysis.tips?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {item.analysis.tips.map((tip, tipIndex) => (
            <li key={`${index}-tip-${tipIndex}`} className="text-sm text-gray-600 dark:text-slate-400">
              - {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InterviewResultCard;
