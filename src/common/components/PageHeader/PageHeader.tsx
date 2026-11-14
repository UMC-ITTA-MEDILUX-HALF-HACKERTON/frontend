"use client";

import { useRouter } from "next/navigation";

// 화면 위쪽 제목줄. 뒤로가기(←) 또는 닫기(✕) 버튼과 오른쪽 영역을 둘 수 있다.
export function PageHeader({
  title,
  back = "back",
  onBack,
  right,
}: {
  title: string;
  back?: "back" | "close" | "none";
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());
  return (
    <header className="flex items-center gap-3 px-5 pt-5 pb-3">
      {back !== "none" ? (
        <button
          type="button"
          onClick={handleBack}
          aria-label={back === "close" ? "닫기" : "뒤로가기"}
          className="bg-fill flex size-10 shrink-0 items-center justify-center rounded-xl text-lg"
        >
          {back === "close" ? "✕" : "←"}
        </button>
      ) : null}
      <h1 className="flex-1 truncate text-lg font-black">{title}</h1>
      {right}
    </header>
  );
}
