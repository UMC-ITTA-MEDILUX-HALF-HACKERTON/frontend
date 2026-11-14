"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@common/utils/cn";
import type { GameSession } from "@features/room/hooks/useGameSession";
import { useMiniGame } from "@features/minigame";
import { padScore } from "@features/room/utils/game";

import { GameHelpModal } from "./GameHelpModal.client";
import { GameScoreboard } from "./GameScoreboard";

const PIXEL = "font-[family-name:var(--font-pixel)]";
const COUNTDOWN_SECONDS = 3;

type Phase = "countdown" | "ready" | "playing" | "over";

// S-003b~d 가로 화면 플레이. 3초 카운트다운 -> "TAP TO START" -> 플레이 -> 게임 오버(다른 사람 기다리는 중).
// 화면 전체를 덮어서 모바일 폭 프레임 밖으로 나간다. 게임은 features/minigame 의 공룡이다.
export function LandscapeGame({ session, onExit }: { session: GameSession; onExit: () => void }) {
  const { room, board, me, isLate, target, rows, completedCount, totalCount, liveScore } = session;
  const [phase, setPhase] = useState<Phase>("countdown");
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [helpOpen, setHelpOpen] = useState(false);

  // 3, 2, 1 카운트다운. 도움말이 열려 있는 동안은 멈춘다.
  useEffect(() => {
    if (phase !== "countdown" || helpOpen) return;
    const id = setTimeout(() => {
      if (count <= 1) setPhase("ready");
      else setCount(count - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [phase, count, helpOpen]);

  // 화면 탭이나 스페이스로 시작한다 (미니게임이 같은 입력으로 첫 점프를 시작한다).
  useEffect(() => {
    if (phase !== "ready" || helpOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowUp") setPhase("playing");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, helpOpen]);

  const paused = phase === "countdown" || phase === "over" || helpOpen;
  const remaining = target !== null ? target - liveScore : null;

  // 게임 엔진은 미니게임 모듈이 돌리고, 화면 전체를 탭 영역으로 쓴다.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { press, release } = useMiniGame({
    game: "dino",
    canvasRef,
    paused,
    onScore: session.setLiveScore,
    onGameOver: ({ score }) => {
      setPhase("over");
      session.finishGame(score);
    },
    theme: { background: "#ffffff", ground: "#c9cfdb", foreground: "#535a6b" },
  });

  // 점수판 내용은 단계마다 다르다.
  const scoreboard =
    phase === "over" ? (
      <GameScoreboard
        variant="dark"
        head={{ label: "내 점수 · 기록 완료", value: padScore(liveScore), pixel: true }}
        second={
          isLate && target !== null
            ? {
                label: "평균까지",
                value: `${liveScore - target > 0 ? "+" : ""}${liveScore - target}점`,
                highlight: true,
              }
            : undefined
        }
        summary={{
          label: completedCount >= totalCount ? "모두 완료" : "아직 하는 중",
          value: `${completedCount}/${totalCount} 완료`,
        }}
        rows={rows}
      />
    ) : phase === "playing" ? (
      <GameScoreboard
        variant="light"
        head={
          isLate && remaining !== null
            ? {
                label: "목표까지",
                value: remaining > 0 ? `${remaining}점 남음` : "목표 달성!",
              }
            : { label: "내 점수", value: padScore(liveScore), pixel: true }
        }
        bar={{ current: liveScore, target }}
        summary={
          board.arrivedAverage !== null
            ? { label: "실시간 점수", value: `평균 ${padScore(board.arrivedAverage)}` }
            : { label: "실시간 점수", value: `${completedCount}/${totalCount} 완료` }
        }
        rows={rows}
      />
    ) : (
      <GameScoreboard
        variant="light"
        head={
          isLate && target !== null
            ? { label: "목표 · 도착자 평균", value: padScore(target), pixel: true }
            : { label: "내 점수", value: padScore(liveScore), pixel: true }
        }
        bar={{ current: liveScore, target }}
        summary={{ label: "실시간 점수", value: `${completedCount}/${totalCount} 완료` }}
        rows={rows}
      />
    );

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-white">
      {/* 게임 화면: 아래쪽에 가득 채운다 */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="공룡 달리기 미니게임"
        className="absolute inset-x-0 bottom-0 block w-full touch-none select-none"
        style={{ aspectRatio: "600 / 200" }}
      />

      {/* 화면 전체가 탭 영역: 준비 상태에서 탭하면 시작하고, 플레이 중 탭하면 점프한다. 버튼들은 이 위에 놓인다. */}
      <div
        aria-hidden
        className="absolute inset-0 touch-none"
        onPointerDown={() => {
          if (phase === "ready" && !helpOpen) setPhase("playing");
          press("primary");
        }}
        onPointerUp={() => release("primary")}
      />

      {/* 왼쪽 위: 닫기, 도움말, 내 역할 */}
      <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          aria-label="게임 나가기"
          className="flex size-[34px] items-center justify-center rounded-[11px] border border-[#e3e8f0] bg-white/90 text-sm font-black text-[#151a24]"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="게임 방법"
          className="flex size-[34px] items-center justify-center rounded-[11px] border border-[#c9d8ff] bg-[#eaf1ff]/95 text-sm font-black text-[#1c4fd8]"
        >
          ?
        </button>
        <span
          className={cn(
            "rounded-full px-[9px] py-1 text-[11px] font-bold",
            isLate ? "bg-[#fff8d6] text-[#9a6b00]" : "bg-[#f3f5f9] text-[#6b7385]",
          )}
        >
          {me.nickname} · {isLate ? "늦은 사람" : "도착자"}
        </span>
      </div>

      {/* 위쪽 가운데: 최고 점수와 현재 점수 */}
      <p
        className={cn(
          PIXEL,
          "pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 text-[15px] whitespace-pre text-[#6b7385]/60",
        )}
        aria-label={`최고 점수 ${session.bestScore}, 현재 점수 ${liveScore}`}
      >
        {`HI ${padScore(session.bestScore)}   ${padScore(liveScore)}`}
      </p>

      {scoreboard}

      {/* 가운데 안내: 캔버스와 같은 영역의 정중앙에 놓고, 흰 바탕으로 모듈이 캔버스에 그리는 기본 안내문을 가린다. */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center"
        style={{ aspectRatio: "600 / 200" }}
      >
        {phase === "countdown" ? (
          <div className="flex flex-col items-center gap-3 bg-white px-16 py-4 text-[#535a6b]">
            <span className={cn(PIXEL, "text-[60px] leading-none")}>{count}</span>
            <span className={cn(PIXEL, "text-base")}>READY</span>
          </div>
        ) : null}
        {phase === "ready" ? (
          <p className={cn(PIXEL, "bg-white px-16 py-6 text-[22px] text-[#535a6b]")}>
            TAP TO START
          </p>
        ) : null}
        {phase === "over" ? (
          <p
            className={cn(PIXEL, "bg-white px-12 py-6 text-[26px] tracking-[0.3em] text-[#535a6b]")}
          >
            GAME OVER
          </p>
        ) : null}
      </div>
      {phase === "over" ? (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(21,26,36,0.85)] px-3 py-1.5 text-[11.5px] font-bold whitespace-nowrap text-white">
          {session.error ?? "모두 끝나면 결과 화면으로 넘어가요"}
        </p>
      ) : null}

      <GameHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} baseFee={room.baseFee} />
    </div>
  );
}
