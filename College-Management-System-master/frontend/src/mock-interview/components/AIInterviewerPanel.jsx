import React from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "../../components/ui/Button";

const AIInterviewerPanel = ({
  isSpeaking,
  questionText,
  onReplay,
  interviewerName = "Alex",
}) => (
  <motion.div className="rounded-2xl border border-indigo-200/40 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-600/10 via-violet-500/5 to-transparent p-5">
    <div className="flex items-start gap-4">
      <div className="relative flex-shrink-0">
        <motion.div
          animate={
            isSpeaking
              ? { scale: [1, 1.08, 1], boxShadow: "0 0 0 12px rgba(99,102,241,0.15)" }
              : { scale: 1, boxShadow: "0 0 0 0px rgba(99,102,241,0)" }
          }
          transition={{ repeat: isSpeaking ? Infinity : 0, duration: 1.2 }}
          className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white",
            "bg-gradient-to-br from-indigo-500 to-violet-600"
          )}
        >
          AI
        </motion.div>
        {isSpeaking && (
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
              AI Interviewer
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">{interviewerName}</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onReplay}>
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isSpeaking ? "Speaking…" : "Replay question"}
          </Button>
        </div>

        <p
          className={cn(
            "mt-3 text-sm leading-relaxed rounded-xl p-3",
            isSpeaking
              ? "bg-indigo-50 dark:bg-indigo-950/50 text-slate-800 dark:text-slate-100 ring-2 ring-indigo-300/50"
              : "bg-white/60 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300"
          )}
        >
          {questionText || "Preparing your personalized question…"}
        </p>

        {isSpeaking && (
          <div className="flex items-center gap-1 mt-3 h-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-indigo-500"
                animate={{ height: ["8px", "22px", "8px"] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: i * 0.1,
                }}
              />
            ))}
            <span className="text-xs text-indigo-600 dark:text-indigo-300 ml-2">
              Asking question via AI voice…
            </span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

export default AIInterviewerPanel;
