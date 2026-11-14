"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 지각비 게임의 T-Rex 러너. 화면을 탭(또는 스페이스)하면 시작하고, 탭하면 점프한다. 장애물에 부딪히면 끝난다.
// 점수는 달린 거리에 비례한다. 끝나면 onGameOver 로 최종 점수를 한 번만 알려 준다.

const WIDTH = 320;
const HEIGHT = 200;
const GROUND_Y = 164;
const DINO_X = 36;
const DINO_W = 26;
const DINO_H = 30;
const GRAVITY = 0.7;
const JUMP_VELOCITY = -11.5;
const START_SPEED = 4.6;
const MAX_SPEED = 9;
const DISTANCE_PER_POINT = 6;

type Phase = "ready" | "playing" | "over";

interface Obstacle {
  x: number;
  w: number;
  h: number;
}

interface World {
  y: number; // 지면에서 공룡 발까지 높이 (0 이면 땅 위)
  vy: number;
  obstacles: Obstacle[];
  speed: number;
  distance: number;
  untilSpawn: number;
  lastScore: number;
}

function createWorld(): World {
  return {
    y: 0,
    vy: 0,
    obstacles: [],
    speed: START_SPEED,
    distance: 0,
    untilSpawn: 70,
    lastScore: 0,
  };
}

function hits(world: World): boolean {
  const dinoTop = GROUND_Y - world.y - DINO_H;
  const dinoBottom = GROUND_Y - world.y;
  return world.obstacles.some((o) => {
    const overlapX = DINO_X + DINO_W - 6 > o.x + 4 && DINO_X + 6 < o.x + o.w - 4;
    const overlapY = dinoBottom > GROUND_Y - o.h + 4 && dinoTop < GROUND_Y;
    return overlapX && overlapY;
  });
}

function draw(ctx: CanvasRenderingContext2D, world: World) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "#d9d7e6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 2);
  ctx.lineTo(WIDTH, GROUND_Y + 2);
  ctx.stroke();

  ctx.textBaseline = "alphabetic";
  ctx.font = "32px sans-serif";
  ctx.fillText("🦖", DINO_X - 4, GROUND_Y - world.y);
  ctx.font = "26px sans-serif";
  for (const o of world.obstacles) ctx.fillText("🌵", o.x, GROUND_Y);
}

export function RunnerGame({
  onScoreChange,
  onGameOver,
}: {
  onScoreChange?: (score: number) => void;
  onGameOver: (score: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World>(createWorld());
  const phaseRef = useRef<Phase>("ready");
  const [phase, setPhaseState] = useState<Phase>("ready");
  // 부모가 새 함수를 넘겨도 게임 루프를 다시 시작하지 않도록 최신 콜백만 ref 로 들고 있는다.
  const callbacks = useRef({ onScoreChange, onGameOver });
  useEffect(() => {
    callbacks.current = { onScoreChange, onGameOver };
  });

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const press = useCallback(() => {
    if (phaseRef.current === "ready") {
      worldRef.current = createWorld();
      setPhase("playing");
      return;
    }
    if (phaseRef.current === "playing" && worldRef.current.y === 0) {
      worldRef.current.vy = JUMP_VELOCITY;
    }
  }, [setPhase]);

  // 스페이스, 위쪽 화살표로도 점프한다.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        press();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    draw(ctx, worldRef.current);
    if (phase !== "playing") return;

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // 화면 주사율이 달라도 같은 속도가 되도록 60fps 기준으로 보정한다 (탭 전환 뒤 튀지 않게 상한을 둔다).
      const step = Math.min((now - last) / 16.67, 3);
      last = now;
      const world = worldRef.current;

      world.vy += GRAVITY * step;
      world.y = Math.max(0, world.y - world.vy * step);
      if (world.y === 0 && world.vy > 0) world.vy = 0;

      world.speed = Math.min(MAX_SPEED, START_SPEED + world.distance / 2500);
      world.distance += world.speed * step;
      for (const o of world.obstacles) o.x -= world.speed * step;
      world.obstacles = world.obstacles.filter((o) => o.x + o.w > -10);

      world.untilSpawn -= step;
      if (world.untilSpawn <= 0) {
        world.obstacles.push({ x: WIDTH + 10, w: 18, h: 26 });
        // 속도가 빨라질수록 간격(프레임 수)을 조금 줄이되, 항상 뛰어넘을 수 있게 남긴다.
        world.untilSpawn = 55 + Math.random() * 50 - (world.speed - START_SPEED) * 3;
      }

      const score = Math.floor(world.distance / DISTANCE_PER_POINT);
      if (score !== world.lastScore) {
        world.lastScore = score;
        callbacks.current.onScoreChange?.(score);
      }

      draw(ctx, world);
      if (hits(world)) {
        setPhase("over");
        callbacks.current.onGameOver(score);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, setPhase]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={phase === "ready" ? "탭해서 게임 시작" : "탭해서 점프"}
      onPointerDown={press}
      className="bg-fill relative touch-none overflow-hidden rounded-3xl select-none"
    >
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="block h-auto w-full"
        aria-hidden
      />
      {phase === "ready" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-lg font-black">탭해서 시작!</p>
          <p className="text-sub text-xs">장애물을 피해 약속 장소까지 달려요</p>
        </div>
      ) : null}
      {phase === "over" ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-full bg-white/90 px-4 py-2 text-sm font-black">게임 끝!</p>
        </div>
      ) : null}
    </div>
  );
}
