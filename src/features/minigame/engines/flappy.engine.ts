import type { GameAction, GameStatus, MiniGameEngine, Rng } from "../types/minigame.types";

export const FLAPPY = {
  width: 360,
  height: 540,
  groundHeight: 60,
  birdX: 90,
  birdRadius: 14,
  gravity: 1500, // px/s²
  flapVelocity: -440, // px/s
  maxFallSpeed: 700,
  pipeWidth: 58,
  pipeGap: 150,
  pipeSpacing: 210,
  pipeSpeed: 150,
  pipeMinTop: 60,
} as const;

export interface FlappyPipe {
  x: number;
  gapTop: number; // 위 파이프 끝 y
  passed: boolean;
}

export class FlappyEngine implements MiniGameEngine {
  readonly id = "flappy" as const;
  readonly width = FLAPPY.width;
  readonly height = FLAPPY.height;

  status: GameStatus = "ready";
  score = 0;
  highScore = 0;

  birdY = (FLAPPY.height - FLAPPY.groundHeight) / 2;
  birdVy = 0;
  pipes: FlappyPipe[] = [];
  elapsedMs = 0; // 애니메이션용

  constructor(private readonly rng: Rng = Math.random) {}

  get groundY(): number {
    return FLAPPY.height - FLAPPY.groundHeight;
  }

  reset(): void {
    this.status = "ready";
    this.score = 0;
    this.birdY = this.groundY / 2;
    this.birdVy = 0;
    this.pipes = [];
    this.elapsedMs = 0;
  }

  press(action: GameAction): void {
    if (action !== "primary" || this.status === "over") return;
    if (this.status === "ready") this.start();
    this.birdVy = FLAPPY.flapVelocity;
  }

  release(): void {}

  update(dtMs: number): void {
    const dt = Math.min(dtMs, 50) / 1000;
    this.elapsedMs += dt * 1000;
    if (this.status !== "playing") return;

    this.birdVy = Math.min(this.birdVy + FLAPPY.gravity * dt, FLAPPY.maxFallSpeed);
    this.birdY += this.birdVy * dt;

    for (const pipe of this.pipes) pipe.x -= FLAPPY.pipeSpeed * dt;
    this.pipes = this.pipes.filter((p) => p.x + FLAPPY.pipeWidth > 0);
    const last = this.pipes[this.pipes.length - 1];
    if (!last || last.x <= FLAPPY.width - FLAPPY.pipeSpacing) this.spawnPipe();

    for (const pipe of this.pipes) {
      if (!pipe.passed && pipe.x + FLAPPY.pipeWidth < FLAPPY.birdX - FLAPPY.birdRadius) {
        pipe.passed = true;
        this.score += 1;
      }
    }

    if (this.collides()) {
      this.status = "over";
      this.highScore = Math.max(this.highScore, this.score);
    }
  }

  private start(): void {
    this.status = "playing";
    this.score = 0;
    this.pipes = [];
    this.spawnPipe(FLAPPY.width + 40);
  }

  private spawnPipe(x: number = FLAPPY.width): void {
    const range = this.groundY - FLAPPY.pipeGap - FLAPPY.pipeMinTop * 2;
    const gapTop = FLAPPY.pipeMinTop + this.rng() * range;
    this.pipes.push({ x, gapTop, passed: false });
  }

  private collides(): boolean {
    const r = FLAPPY.birdRadius;
    if (this.birdY + r >= this.groundY) {
      this.birdY = this.groundY - r;
      return true;
    }
    if (this.birdY - r <= 0) {
      this.birdY = r;
      return true;
    }
    for (const pipe of this.pipes) {
      const overlapsX = FLAPPY.birdX + r > pipe.x && FLAPPY.birdX - r < pipe.x + FLAPPY.pipeWidth;
      if (!overlapsX) continue;
      if (this.birdY - r < pipe.gapTop || this.birdY + r > pipe.gapTop + FLAPPY.pipeGap) {
        return true;
      }
    }
    return false;
  }
}
