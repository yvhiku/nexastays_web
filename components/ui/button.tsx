import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] font-sans text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-nexa-primary text-white shadow-[0_4px_16px_rgba(232,80,122,.32)] hover:bg-nexa-primary-dark hover:shadow-[0_6px_24px_rgba(232,80,122,.42)] hover:-translate-y-px",
        outline:
          "border-[1.5px] border-nexa-primary text-nexa-primary bg-transparent hover:bg-nexa-primary-soft hover:-translate-y-px",
        ghost:
          "border border-nexa-line bg-transparent text-nexa-ink-3 hover:bg-nexa-bg-2 hover:text-nexa-ink",
        white:
          "bg-white text-nexa-primary shadow-nexa-md hover:shadow-nexa-lg hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 min-h-[44px] px-6 py-3",
        sm: "h-9 min-h-[44px] sm:min-h-0 sm:h-9 px-4 text-xs rounded-lg",
        lg: "h-12 min-h-[48px] px-8 text-base rounded-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
