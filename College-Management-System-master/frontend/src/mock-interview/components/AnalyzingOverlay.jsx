import React from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import GlassCard from "./GlassCard";

const AnalyzingOverlay = ({ title, subtitle }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center min-h-[420px]"
  >
    <GlassCard className="p-10 max-w-md w-full text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white mb-6"
      >
        <Brain size={32} />
      </motion.div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
        <Sparkles className="text-indigo-500" size={20} />
        {title}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{subtitle}</p>
      <div className="mt-6 flex justify-center gap-2">
        {["Communication", "Technical", "Confidence", "Behavior"].map((label, i) => (
          <motion.span
            key={label}
            className="text-[10px] px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
          >
            {label}
          </motion.span>
        ))}
      </div>
    </GlassCard>
  </motion.div>
);

export default AnalyzingOverlay;
