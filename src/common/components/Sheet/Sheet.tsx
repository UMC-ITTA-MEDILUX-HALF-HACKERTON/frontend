"use client";

import { useEffect } from "react";

import { cn } from "@common/utils/cn";

// 아래에서 올라오는 시트(후보 추가, 도착 관리). 바깥을 누르거나 Esc 를 누르면 닫힌다.
export function Sheet({
  open,
  onClose,
  title,
  badge,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col justify-end">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="bg-ink/50 absolute inset-0 cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-white px-5 pt-3 pb-6",
          "shadow-[0_-8px_30px_rgba(22,21,31,0.15)]",
        )}
      >
        <div className="bg-ink/10 mx-auto mb-4 h-1 w-10 rounded-full" aria-hidden />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">{title}</h2>
          {badge}
        </div>
        {children}
      </section>
    </div>
  );
}
