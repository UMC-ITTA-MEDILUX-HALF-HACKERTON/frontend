"use client";

import { useId } from "react";

import { cn } from "@common/utils/cn";

// 날짜, 시간 선택 필드. 화면에는 디자인 형식의 글자(예: "11/14 (금)", "오후 7:00")를 보여 주고,
// 실제 선택은 그 위에 투명하게 겹쳐 둔 브라우저 기본 선택기(input type=date, time)가 맡는다.
export function PickerField({
  label,
  type,
  value,
  display,
  onChange,
  error,
}: {
  label: string;
  type: "date" | "time";
  // input 이 쓰는 값. "YYYY-MM-DD" 또는 "HH:mm"
  value: string;
  // 화면에 보여 줄 글자
  display: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
      </label>
      <div
        className={cn(
          "bg-fill focus-within:border-primary relative flex h-12 items-center rounded-2xl border border-transparent px-4 text-[15px] font-medium focus-within:bg-white",
          error && "border-coral",
        )}
      >
        <span aria-hidden>{display}</span>
        <input
          id={id}
          type={type}
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          // 글자 위 어디를 눌러도 선택기가 열리게 한다 (지원하지 않는 브라우저는 기본 동작).
          onClick={(event) => {
            try {
              event.currentTarget.showPicker?.();
            } catch {
              // 일부 브라우저는 사용자 동작 직후가 아니면 거절한다. 기본 동작에 맡긴다.
            }
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      {error ? <p className="text-coral text-xs font-medium">{error}</p> : null}
    </div>
  );
}
