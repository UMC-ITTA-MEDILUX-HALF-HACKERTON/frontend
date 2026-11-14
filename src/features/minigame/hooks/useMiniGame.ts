"use client";

import { useEffect, useRef, type RefObject } from "react";

import { createEngine } from "../engines/create-engine";
import { renderGame } from "../engines/render";
import {
  DEFAULT_THEME,
  type GameAction,
  type MiniGameCallbacks,
  type MiniGameEngine,
  type MiniGameId,
  type MiniGameTheme,
} from "../types/minigame.types";

interface Options extends MiniGameCallbacks {
  game: MiniGameId;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  theme?: Partial<MiniGameTheme>;
  paused?: boolean; // true 면 게임 루프와 키 입력을 멈춘다
  captureKeys?: boolean; // 기본 true. 스페이스/↑/↓ 키로 조작
}

const PRIMARY_KEYS = new Set([" ", "ArrowUp"]);
const DUCK_KEYS = new Set(["ArrowDown"]);

// 캔버스에 게임 루프를 붙이고, 조작용 press/release 를 돌려준다.
// 캔버스 해상도는 논리 크기 × devicePixelRatio 로 맞춘다. CSS 크기는 사용하는 쪽이 정한다.
export function useMiniGame({
  game,
  canvasRef,
  theme,
  paused = false,
  captureKeys = true,
  onScore,
  onGameOver,
}: Options) {
  const engineRef = useRef<MiniGameEngine | null>(null);
  const cbRef = useRef({ onScore, onGameOver });
  const themeRef = useRef<MiniGameTheme>({ ...DEFAULT_THEME, ...theme });
  const pausedRef = useRef(paused);

  useEffect(() => {
    cbRef.current = { onScore, onGameOver };
    themeRef.current = { ...DEFAULT_THEME, ...theme };
    pausedRef.current = paused;
  });

  // 게임이 바뀔 때만 엔진/루프를 새로 만든다 (paused 는 ref 로 읽어 최고점이 유지된다)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const engine = createEngine(game);
    engineRef.current = engine;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = engine.width * dpr;
    canvas.height = engine.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let last = 0;
    let lastScore = 0;
    let wasOver = false;

    const frame = (now: number) => {
      const dt = last ? now - last : 16;
      last = now;
      if (!pausedRef.current) {
        engine.update(dt);
        if (engine.score !== lastScore) {
          lastScore = engine.score;
          cbRef.current.onScore?.(lastScore);
        }
        if (engine.status === "over" && !wasOver) {
          cbRef.current.onGameOver?.({ game, score: engine.score, highScore: engine.highScore });
        }
        wasOver = engine.status === "over";
      }
      renderGame(ctx, engine, themeRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      engineRef.current = null;
    };
  }, [game, canvasRef]);

  useEffect(() => {
    if (!captureKeys || paused) return;
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (PRIMARY_KEYS.has(e.key)) {
        e.preventDefault();
        press("primary");
      } else if (DUCK_KEYS.has(e.key)) {
        e.preventDefault();
        press("duck");
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (DUCK_KEYS.has(e.key)) release("duck");
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
    // press/release 는 engineRef 만 쓰므로 매 렌더 새로 만들어도 동작이 같다
  }, [captureKeys, paused]);

  function press(action: GameAction) {
    const engine = engineRef.current;
    if (!engine || pausedRef.current) return;
    // 게임 오버 상태에서 primary 를 누르면 새 판을 시작한다
    if (engine.status === "over") {
      if (action === "primary") engine.reset();
      return;
    }
    engine.press(action);
  }

  function release(action: GameAction) {
    engineRef.current?.release(action);
  }

  return { press, release, reset: () => engineRef.current?.reset() };
}
