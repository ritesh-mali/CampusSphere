import React from "react";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";

const NoData = ({ title, message }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
      className="flex flex-col items-center justify-center py-24 px-4 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl animate-pulse-glow" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <SearchX className="h-10 w-10 text-brand-500 dark:text-brand-400" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        {title || "No data found"}
      </h3>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {message || "We couldn't find anything to show here right now. Check back later or try adding something new."}
      </p>
    </motion.div>
  );
};

export default NoData;
