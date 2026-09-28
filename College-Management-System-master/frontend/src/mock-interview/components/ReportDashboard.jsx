import React from "react";
import { motion } from "framer-motion";
import { Download, Target, BookOpen, AlertCircle } from "lucide-react";
import GlassCard from "./GlassCard";
import PerformanceCharts from "./PerformanceCharts";
import Button from "../../components/ui/Button";
import { cn } from "../../utils/cn";

const ScorePill = ({ label, value }) => (
  <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 px-4 py-3 text-center">
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">
      {value}%
    </p>
  </div>
);

const ReportDashboard = ({ result, onDownloadPdf, downloading }) => {
  if (!result) return null;
  const scores = result.scores || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {result.role} Interview
            </p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Overall Score: {scores.overall}%
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
              {result.overallFeedback}
            </p>
          </div>
          <Button onClick={onDownloadPdf} loading={downloading} variant="outline">
            <Download size={16} />
            Download PDF
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <ScorePill label="Technical" value={scores.technical} />
          <ScorePill label="Communication" value={scores.communication} />
          <ScorePill label="Confidence" value={scores.confidence} />
          <ScorePill label="Readiness" value={scores.interviewReadiness} />
        </div>
      </GlassCard>

      <PerformanceCharts scores={scores} chartData={result.chartData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-5" delay={0.05}>
          <h3 className="font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Target size={18} /> Strengths
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {(result.strengths || []).map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-5" delay={0.1}>
          <h3 className="font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle size={18} /> Weaknesses
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {(result.weaknesses || []).map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard className="p-5" delay={0.15}>
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen size={18} /> Improvement Roadmap
        </h3>
        <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
          {(result.improvementRoadmap || []).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-medium text-slate-500">Missing concepts</p>
            <p className="text-sm mt-1">
              {(result.missingConcepts || []).join(", ") || "None flagged"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-medium text-slate-500">Resources</p>
            <ul className="text-sm mt-1">
              {(result.learningResources || []).map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>

      {result.emotionMetrics && (
        <GlassCard className="p-5">
          <h3 className="font-semibold mb-3">Behavioral & Emotion Analysis</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              ["Confidence", result.emotionMetrics.confidence],
              ["Nervousness", result.emotionMetrics.nervousness],
              ["Eye Contact", result.emotionMetrics.eyeContact],
              ["Attention", result.emotionMetrics.attention],
            ].map(([label, val]) => (
              <div
                key={label}
                className={cn(
                  "rounded-lg p-3 bg-slate-50 dark:bg-slate-800/60"
                )}
              >
                <p className="text-slate-500 text-xs">{label}</p>
                <p className="font-bold text-lg">{val}%</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
            {result.emotionMetrics.behavioralSummary}
          </p>
        </GlassCard>
      )}
    </motion.div>
  );
};

export default ReportDashboard;
