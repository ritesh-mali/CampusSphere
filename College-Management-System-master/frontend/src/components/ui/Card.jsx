import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export function Card({ className, hover = true, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      transition={{ type: "spring", stiffness: 450, damping: 35 }}
      className={cn(
        "rounded-2xl bg-white/80 dark:bg-slate-900/70",
        "border border-slate-200/70 dark:border-slate-800/70",
        "shadow-soft backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("px-5 pt-5 pb-3 flex items-start justify-between", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("text-base font-semibold text-slate-900 dark:text-slate-100", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-600 dark:text-slate-300", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

