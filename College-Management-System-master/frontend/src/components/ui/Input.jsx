import React from "react";
import { cn } from "../../utils/cn";

const Input = React.forwardRef(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-10 w-full rounded-xl bg-white dark:bg-slate-900",
          "border border-slate-200 dark:border-slate-800",
          "px-3 text-sm text-slate-900 dark:text-slate-100",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
          "shadow-sm",
          "outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-brand-400 dark:ring-offset-slate-950",
          "transition",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;

