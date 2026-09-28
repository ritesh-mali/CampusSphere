import React from "react";
import { cn } from "../../utils/cn";
import Button from "./Button";

export default function EmptyState({
  icon,
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
  className,
}) {
  const Icon = icon;

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-200 dark:border-slate-800",
        "bg-white/60 dark:bg-slate-900/40",
        "p-8 text-center shadow-soft",
        className
      )}
    >
      {Icon ? (
        <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
      ) : null}
      {actionLabel ? (
        <div className="mt-5 flex justify-center">
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

