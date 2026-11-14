"use client";

import { useRef, useState } from "react";

import { PageHeader } from "@common/components/PageHeader/PageHeader";
import { useMiniGame } from "@features/minigame";
import { MemberAvatar } from "@features/room/components/MemberAvatar/MemberAvatar";
import { MockMeSwitcher } from "@features/room/components/MockMeSwitcher/MockMeSwitcher.client";
import type { GameSession } from "@features/room/hooks/useGameSession";

// S-003b(세로) 폰을 가로로 돌리지 않고 세로로 하는 플레이 화면. 화면을 탭해서 시작하고, 탭하면 점프한다.
export function PortraitGame({ session, onExit }: { session: GameSession; onExit: () => void }) {
  const { me, isLate, target, rows, liveScore, finished } = session;
  const [over, setOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { press, release } = useMiniGame({
    game: "dino",
    canvasRef,
    paused: over,
    onScore: session.setLiveScore,
    onGameOver: ({ score }) => {
      setOver(true);
      session.finishGame(score);
    },
    theme: { background: "#f3f5f9", ground: "#c9cfdb", foreground: "#535a6b" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <MockMeSwitcher roomId={session.roomId} />
      <PageHeader title={`${me.nickname} 플레이 중`} back="close" onBack={onExit} />
      <div className="flex flex-1 flex-col gap-3 px-5">
        <div className="flex items-end justify-between">
          <span className="text-sub text-xs">현재 점수</span>
          <span className="text-primary text-[34px] leading-none font-black tabular-nums">
            {liveScore}
          </span>
        </div>
        {isLate && target !== null ? (
          <div className="bg-fill flex items-center justify-between rounded-xl px-4 py-2.5 text-xs">
            <span className="text-sub">이겨야 할 점수 (도착자 평균)</span>
            <span className="font-black tabular-nums">{target}</span>
          </div>
        ) : null}

        <div
          role="button"
          tabIndex={0}
          aria-label="탭해서 시작하고 탭하면 점프"
          onPointerDown={() => press("primary")}
          onPointerUp={() => release("primary")}
          className="relative h-[230px] touch-none overflow-hidden rounded-3xl bg-[#f3f5f9] select-none"
        >
          <canvas
            ref={canvasRef}
            aria-hidden
            className="absolute inset-x-0 bottom-0 block w-full"
            style={{ aspectRatio: "600 / 200" }}
          />
          {liveScore === 0 && !over ? (
            <div className="pointer-events-none absolute inset-x-0 top-[30%] text-center">
              <p className="text-lg font-black">탭해서 시작!</p>
              <p className="text-sub text-xs">장애물을 피해 약속 장소까지 달려요</p>
            </div>
          ) : null}
          {over ? (
            <p className="pointer-events-none absolute inset-x-0 top-[34%] text-center text-lg font-black">
              게임 끝!
            </p>
          ) : null}
        </div>
        <p className="text-sub text-center text-xs">화면을 탭해서 시작 · 탭하면 점프</p>

        <ul className="mt-1 flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.memberId} className="flex items-center gap-3">
              <MemberAvatar nickname={row.nickname} index={row.index} size="sm" />
              <span className="flex-1 text-sm font-bold">{row.nickname}</span>
              {row.score !== null ? (
                <span className="text-sm font-black tabular-nums">{row.score}</span>
              ) : (
                <span className="text-sub text-xs">대기 중</span>
              )}
            </li>
          ))}
        </ul>
        {finished ? (
          <p className="text-sub text-center text-xs">
            {session.error ?? "모두 끝나면 결과 화면으로 넘어가요"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
