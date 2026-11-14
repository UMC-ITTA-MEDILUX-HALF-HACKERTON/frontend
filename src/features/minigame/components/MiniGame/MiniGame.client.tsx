"use client";

import { useRef } from "react";

import { cn } from "@common/utils/cn";

import { useMiniGame } from "../../hooks/useMiniGame";
import type { MiniGameCallbacks, MiniGameId, MiniGameTheme } from "../../types/minigame.types";

interface MiniGameProps extends MiniGameCallbacks {
  game: MiniGameId;
  theme?: Partial<MiniGameTheme>;
  paused?: boolean;
  captureKeys?: boolean;
  className?: string; // 크기/모서리는 바깥에서 정한다. 캔버스는 너비 100%, 비율 유지
}

const ASPECT: Record<MiniGameId, string> = { flappy: "360 / 540", dino: "600 / 200" };
const LABEL: Record<MiniGameId, string> = {
  flappy: "플래피 버드 미니게임",
  dino: "공룡 달리기 미니게임",
};

// 화면 작업이 끝나기 전까지는 원하는 곳에 끼워 쓰기만 하면 된다.
// 예) <MiniGame game="flappy" onGameOver={({ score }) => ...} />
export function MiniGame({ game, className, ...options }: MiniGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { press, release } = useMiniGame({ game, canvasRef, ...options });

  return (
    <canvas
      ref={canvasRef}
      className={cn("block w-full touch-none select-none", className)}
      style={{ aspectRatio: ASPECT[game] }}
      onPointerDown={() => press("primary")}
      onPointerUp={() => release("primary")}
      role="img"
      aria-label={LABEL[game]}
    />
  );
}
