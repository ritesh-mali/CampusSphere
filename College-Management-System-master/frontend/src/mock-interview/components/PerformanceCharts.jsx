import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const PerformanceCharts = ({ scores, chartData }) => {
  const radarData = [
    { subject: "Technical", value: scores?.technical || 0 },
    { subject: "Communication", value: scores?.communication || 0 },
    { subject: "Confidence", value: scores?.confidence || 0 },
    { subject: "Grammar", value: scores?.grammar || 0 },
    { subject: "Relevance", value: scores?.relevance || 0 },
    { subject: "Problem Solving", value: scores?.problemSolving || 0 },
  ];

  const barData = (chartData?.labels || []).map((label, i) => ({
    name: label,
    technical: chartData?.technical?.[i] ?? 0,
    communication: chartData?.communication?.[i] ?? 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-72 rounded-xl border border-slate-200/60 dark:border-slate-700 p-2 bg-white/50 dark:bg-slate-900/40">
        <p className="text-sm font-semibold mb-2 px-2 text-slate-700 dark:text-slate-200">
          Skill Radar
        </p>
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
            <Radar
              dataKey="value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-72 rounded-xl border border-slate-200/60 dark:border-slate-700 p-2 bg-white/50 dark:bg-slate-900/40">
        <p className="text-sm font-semibold mb-2 px-2 text-slate-700 dark:text-slate-200">
          Per-Question Performance
        </p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={barData.slice(0, 12)}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="technical" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="communication" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceCharts;
