"use client";

import { useEffect } from "react";

// 가운데에 뜨는 확인 모달 (확정 확인 등).
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
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
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-center justify-center px-6">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="bg-ink/50 absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full rounded-3xl bg-white p-6 text-center shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}
