import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

const GlassCard = ({ className, children, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    className={cn(
      "rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-softer",
      "dark:border-slate-700/50 dark:bg-slate-900/60",
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export default GlassCard;
