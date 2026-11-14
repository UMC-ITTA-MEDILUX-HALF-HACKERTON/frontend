import type { ButtonHTMLAttributes } from "react";

import { cn } from "@common/utils/cn";

type ButtonVariant = "primary" | "soft" | "line";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-primary hover:bg-primary-pressed",
  soft: "bg-primary-soft text-primary",
  line: "border-line bg-surface text-ink",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", type = "button", className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "text-button inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-6 transition active:scale-[0.98] motion-reduce:transition-none",
        "focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:bg-fill disabled:text-disabled disabled:cursor-not-allowed disabled:border-transparent disabled:shadow-none disabled:active:scale-100",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
