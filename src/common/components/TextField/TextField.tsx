import { useId } from "react";

import { Input } from "@common/components/Input";
import { cn } from "@common/utils/cn";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  optionalLabel?: string;
  hint?: string;
  error?: string;
}

// 라벨, 안내 글, 오류 글을 붙인 입력 필드. 입력창 자체는 PR #8 의 Input 이고,
// 화면(Figma)의 입력칸 크기에 맞춰 높이와 모서리만 덮어쓴다.
export function TextField({
  label,
  optionalLabel,
  hint,
  error,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label htmlFor={inputId} className="text-[13px] font-bold">
          {label}
          {optionalLabel ? (
            <span className="text-sub ml-1 font-normal">({optionalLabel})</span>
          ) : null}
        </label>
      ) : null}
      <Input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn("h-12! rounded-2xl! px-4!", error && "border-coral!", className)}
        {...rest}
      />
      {error ? (
        <p className="text-coral text-xs font-medium">{error}</p>
      ) : hint ? (
        <p className="text-sub text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
