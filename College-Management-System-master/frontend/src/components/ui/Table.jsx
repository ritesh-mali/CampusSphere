import React from "react";
import { cn } from "../../utils/cn";

export default function Table({ className, ...props }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70",
        "bg-white/80 dark:bg-slate-900/70 shadow-soft backdrop-blur",
        className
      )}
    >
      <div className="overflow-auto">
        <table className="min-w-full text-left text-sm" {...props} />
      </div>
    </div>
  );
}

export function THead({ className, ...props }) {
  return (
    <thead
      className={cn(
        "sticky top-0 bg-slate-50/90 dark:bg-slate-950/60 backdrop-blur",
        "text-slate-600 dark:text-slate-300",
        className
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }) {
  return (
    <th
      className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wide", className)}
      {...props}
    />
  );
}

export function TR({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-t border-slate-200/70 dark:border-slate-800/70",
        "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }) {
  return (
    <td className={cn("px-4 py-3 text-slate-700 dark:text-slate-200", className)} {...props} />
  );
}

