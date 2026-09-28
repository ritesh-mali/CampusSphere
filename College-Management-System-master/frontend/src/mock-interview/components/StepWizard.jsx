import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

const StepWizard = ({ steps, current }) => (
  <div className="flex flex-wrap items-center gap-2 mb-8">
    {steps.map((step, index) => {
      const done = index < current;
      const active = index === current;
      return (
        <React.Fragment key={step.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
              active &&
                "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30",
              done && !active && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
              !done && !active && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                active && "bg-white/20",
                done && !active && "bg-emerald-500 text-white",
                !done && !active && "bg-slate-200 dark:bg-slate-700"
              )}
            >
              {done && !active ? <Check size={14} /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-6 sm:w-10 rounded",
                index < current ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
              )}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default StepWizard;
