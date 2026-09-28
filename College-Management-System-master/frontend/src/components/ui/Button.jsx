import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-soft hover:shadow-softer",
  secondary:
    "bg-slate-900 text-white hover:bg-slate-800 shadow-soft hover:shadow-softer dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
  outline:
    "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 shadow-soft dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800 dark:hover:bg-slate-800",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 shadow-soft hover:shadow-softer",
};

const SIZES = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

const Button = React.forwardRef(
  (
    {
      asChild = false,
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? motion.span : motion.button;

    return (
      <Comp
        ref={ref}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold",
          "outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-brand-400 dark:ring-offset-slate-950",
          "disabled:opacity-50 disabled:pointer-events-none",
          "select-none",
          SIZES[size],
          VARIANTS[variant] || VARIANTS.primary,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white dark:border-slate-900/25 dark:border-t-slate-900" />
            <span className="opacity-90">Loading</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export default Button;

