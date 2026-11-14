import type { InputHTMLAttributes } from "react";

import { cn } from "@common/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "bg-fill text-body text-ink h-10 w-full rounded-md border border-transparent px-3.5 transition-colors outline-none motion-reduce:transition-none",
        "placeholder:text-disabled focus:border-primary focus:bg-surface",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
