import type { MiniGameEngine, MiniGameTheme } from "../types/minigame.types";
import { DINO, DinoEngine } from "./dino.engine";
import { FLAPPY, FlappyEngine } from "./flappy.engine";

// 임시 도형 렌더러. 디자인이 정해지면 이 파일만 스프라이트/이미지로 교체하면 된다.

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  theme: MiniGameTheme,
  align: CanvasTextAlign = "left",
  size = 16,
) {
  ctx.fillStyle = theme.text;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawOverlay(ctx: CanvasRenderingContext2D, e: MiniGameEngine, theme: MiniGameTheme) {
  if (e.status === "playing") return;
  const cx = e.width / 2;
  const cy = e.height / 2;
  if (e.status === "ready") {
    drawText(ctx, "탭 / 스페이스로 시작", cx, cy, theme, "center", 18);
  } else {
    drawText(ctx, "GAME OVER", cx, cy - 8, theme, "center", 24);
    drawText(ctx, "탭 / 스페이스로 다시 시작", cx, cy + 20, theme, "center", 14);
  }
}

function renderFlappy(ctx: CanvasRenderingContext2D, e: FlappyEngine, theme: MiniGameTheme) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, e.width, e.height);

  ctx.fillStyle = theme.foreground;
  for (const p of e.pipes) {
    ctx.fillRect(p.x, 0, FLAPPY.pipeWidth, p.gapTop);
    const bottomY = p.gapTop + FLAPPY.pipeGap;
    ctx.fillRect(p.x, bottomY, FLAPPY.pipeWidth, e.groundY - bottomY);
  }

  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, e.groundY, e.width, FLAPPY.groundHeight);

  // 새: 속도에 따라 기울인다
  ctx.save();
  ctx.translate(FLAPPY.birdX, e.birdY);
  ctx.rotate(Math.max(-0.5, Math.min(1.2, e.birdVy / 600)));
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(0, 0, FLAPPY.birdRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.background;
  ctx.fillRect(4, -6, 4, 4); // 눈
  ctx.restore();

  drawText(ctx, String(e.score), e.width / 2, 48, theme, "center", 32);
  drawOverlay(ctx, e, theme);
}

function renderDino(ctx: CanvasRenderingContext2D, e: DinoEngine, theme: MiniGameTheme) {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, e.width, e.height);

  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, DINO.groundY, e.width, 2);

  ctx.fillStyle = theme.foreground;
  for (const o of e.obstacles) {
    if (o.kind === "bird") {
      const flap = Math.floor(e.elapsedMs / 150) % 2 === 0;
      ctx.fillRect(o.x, o.y + 8, o.w, 12);
      ctx.fillRect(o.x + 10, flap ? o.y : o.y + 20, 16, 8);
    } else {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  const step = e.status === "playing" && !e.airborne && Math.floor(e.elapsedMs / 100) % 2 === 0;
  const w = e.currentWidth;
  const h = e.currentHeight;
  const top = e.top;
  ctx.fillStyle = theme.foreground;
  ctx.fillRect(DINO.x, top, w, h);
  ctx.fillStyle = theme.background;
  ctx.fillRect(DINO.x + w - 12, top + 6, 4, 4); // 눈
  ctx.fillRect(DINO.x + (step ? 8 : 22), top + h - 6, 8, 6); // 달리는 다리 표시

  const hi = String(e.highScore).padStart(5, "0");
  const cur = String(e.score).padStart(5, "0");
  drawText(ctx, `HI ${hi}  ${cur}`, e.width - 12, 24, theme, "right");
  drawOverlay(ctx, e, theme);
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  engine: MiniGameEngine,
  theme: MiniGameTheme,
): void {
  if (engine instanceof FlappyEngine) renderFlappy(ctx, engine, theme);
  else if (engine instanceof DinoEngine) renderDino(ctx, engine, theme);
}
