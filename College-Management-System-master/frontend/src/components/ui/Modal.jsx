import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            aria-label="Close modal"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative w-full max-w-lg overflow-hidden rounded-2xl",
              "bg-white dark:bg-slate-950",
              "border border-slate-200 dark:border-slate-800",
              "shadow-softer",
              className
            )}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {title ? (
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={onClose}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                    "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    "dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                    "transition"
                  )}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

