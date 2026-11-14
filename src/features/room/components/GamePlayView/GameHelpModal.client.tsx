"use client";

import { useEffect } from "react";

import { formatWon } from "@features/room/utils/time";

const HOW_TO = [
  { icon: "🏃", title: "자동으로 달려요", desc: "약속 장소까지 뛰어가는 중" },
  { icon: "👆", title: "탭하면 점프", desc: "고깔콘과 신호등을 뛰어넘어요" },
  { icon: "⚡", title: "점점 빨라져요", desc: "오래 버틸수록 점수가 올라가요" },
] as const;

// S-003e 게임 방법 도움말. 열려 있는 동안 게임은 멈춘다 (멈추는 것은 부르는 쪽이 한다).
export function GameHelpModal({
  open,
  onClose,
  baseFee,
}: {
  open: boolean;
  onClose: () => void;
  baseFee: number;
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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(21,26,36,0.55)] p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="게임 방법"
        className="flex max-h-full w-[600px] max-w-full flex-col gap-3 overflow-y-auto rounded-3xl bg-white px-5 pt-[18px] pb-4"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-xl">
            ❓
          </span>
          <h2 className="flex-1 text-[17px] font-bold text-[#151a24]">게임 방법</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex size-9 items-center justify-center rounded-xl bg-[#f3f5f9] text-[15px] text-[#151a24]"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-[#f3f5f9] px-[13px] pt-3 pb-4">
            <h3 className="text-[12.5px] font-black text-[#151a24]">이렇게 해요</h3>
            {HOW_TO.map((item) => (
              <div key={item.title} className="flex items-center gap-[9px]">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-white text-sm"
                >
                  {item.icon}
                </span>
                <div>
                  <p className="text-[12.5px] leading-[17.5px] font-bold text-[#151a24]">
                    {item.title}
                  </p>
                  <p className="text-[11px] leading-[15.4px] text-[#6b7385]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-[#f3f5f9] px-[13px] py-3">
            <h3 className="text-[12.5px] font-black text-[#151a24]">지각비는 이렇게 정해져요</h3>
            <p className="text-xs text-[#6b7385]">지각자 팀 평균 vs 도착자 팀 평균</p>
            <Rule label="🎉 늦은 사람이 높으면" value="면제" tone="text-[#12b886]" />
            <Rule label="🤝 같으면" value={formatWon(baseFee)} />
            <Rule label="😅 낮으면" value={formatWon(baseFee * 2)} tone="text-[#ff5c5c]" />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-2xl bg-[#2f6bff] text-[15.5px] font-bold text-white shadow-[0_6px_8px_rgba(47,107,255,0.28)]"
        >
          알겠어요 · 이어서 하기
        </button>
      </section>
    </div>
  );
}

function Rule({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded-[10px] bg-white px-2.5 py-[7px]">
      <span className="text-[12.5px] text-[#151a24]">{label}</span>
      <span className={`text-[12.5px] font-bold ${tone ?? "text-[#151a24]"}`}>{value}</span>
    </div>
  );
}
