import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 min-h-[44px] w-full rounded-xl border-2 border-nexa-line bg-white px-4 py-3 text-base sm:text-sm font-sans text-nexa-ink outline-none transition-colors placeholder:text-nexa-ink-4 focus:border-nexa-primary focus:ring-2 focus:ring-nexa-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
