import type { GameAction, GameStatus, MiniGameEngine, Rng } from "../types/minigame.types";

export const DINO = {
  width: 600,
  height: 200,
  groundY: 160, // 땅 윗면 y
  x: 40,
  standW: 44,
  standH: 48,
  duckW: 58,
  duckH: 28,
  gravity: 2600,
  jumpVelocity: -820,
  fastFallGravity: 6000, // 점프 중 ↓ 를 누르면 빨리 내려온다
  startSpeed: 300,
  maxSpeed: 720,
  accel: 6, // px/s per second
  scoreRate: 0.04, // px 당 점수
  hitMargin: 5, // 판정 여유 (관대하게)
} as const;

export type ObstacleKind = "cactus" | "bird";

export interface DinoObstacle {
  kind: ObstacleKind;
  x: number;
  y: number; // 윗면 y
  w: number;
  h: number;
}

// 새가 나는 높이: 낮게(점프) / 중간(숙이기) / 높게(그냥 지나감)
const BIRD_TOPS = [DINO.groundY - 30, DINO.groundY - 62, DINO.groundY - 100] as const;
const STAND_TOP = DINO.groundY - DINO.standH;

export class DinoEngine implements MiniGameEngine {
  readonly id = "dino" as const;
  readonly width = DINO.width;
  readonly height = DINO.height;

  status: GameStatus = "ready";
  highScore = 0;

  y = STAND_TOP; // 공룡 윗면 y (서 있을 때 기준 땅 위치)
  vy = 0;
  airborne = false;
  ducking = false;
  obstacles: DinoObstacle[] = [];
  speed: number = DINO.startSpeed;
  distance = 0;
  elapsedMs = 0;

  private nextSpawnIn = 0; // 다음 장애물까지 남은 거리(px)

  constructor(private readonly rng: Rng = Math.random) {}

  get score(): number {
    return Math.floor(this.distance * DINO.scoreRate);
  }

  get onGround(): boolean {
    return !this.airborne;
  }

  get currentWidth(): number {
    return this.ducking && !this.airborne ? DINO.duckW : DINO.standW;
  }

  get currentHeight(): number {
    return this.ducking && !this.airborne ? DINO.duckH : DINO.standH;
  }

  // 그릴 때 쓰는 윗면 y. 숙였을 땐 키가 줄어드니 발은 땅에 붙인다.
  get top(): number {
    return this.airborne ? this.y : DINO.groundY - this.currentHeight;
  }

  reset(): void {
    this.status = "ready";
    this.y = STAND_TOP;
    this.vy = 0;
    this.airborne = false;
    this.ducking = false;
    this.obstacles = [];
    this.speed = DINO.startSpeed;
    this.distance = 0;
    this.elapsedMs = 0;
    this.nextSpawnIn = 0;
  }

  press(action: GameAction): void {
    if (this.status === "over") return;
    if (action === "duck") {
      this.ducking = true;
      return;
    }
    if (this.status === "ready") this.status = "playing";
    if (!this.airborne) {
      this.ducking = false;
      this.airborne = true;
      this.vy = DINO.jumpVelocity;
    }
  }

  release(action: GameAction): void {
    if (action === "duck") this.ducking = false;
  }

  update(dtMs: number): void {
    const dt = Math.min(dtMs, 50) / 1000;
    this.elapsedMs += dt * 1000;
    if (this.status !== "playing") return;

    if (this.airborne) {
      const g = this.ducking && this.vy > 0 ? DINO.fastFallGravity : DINO.gravity;
      this.vy += g * dt;
      this.y += this.vy * dt;
      if (this.y >= STAND_TOP) {
        this.y = STAND_TOP;
        this.vy = 0;
        this.airborne = false;
      }
    }

    this.speed = Math.min(this.speed + DINO.accel * dt, DINO.maxSpeed);
    const step = this.speed * dt;
    this.distance += step;

    for (const o of this.obstacles) o.x -= step;
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > 0);
    this.nextSpawnIn -= step;
    if (this.nextSpawnIn <= 0) this.spawn();

    if (this.collides()) {
      this.status = "over";
      this.highScore = Math.max(this.highScore, this.score);
    }
  }

  private spawn(): void {
    const isBird = this.score >= 100 && this.rng() < 0.3;
    if (isBird) {
      const top = BIRD_TOPS[Math.floor(this.rng() * BIRD_TOPS.length)];
      this.obstacles.push({ kind: "bird", x: DINO.width, y: top, w: 42, h: 28 });
    } else {
      const h = 34 + Math.floor(this.rng() * 20);
      const w = 18 + Math.floor(this.rng() * 3) * 14; // 1~3개 묶음
      this.obstacles.push({ kind: "cactus", x: DINO.width, y: DINO.groundY - h, w, h });
    }
    // 속도가 빠를수록 간격을 넓혀 점프할 시간을 확보한다
    this.nextSpawnIn = this.speed * (0.7 + this.rng() * 0.8) + 160;
  }

  private collides(): boolean {
    const m = DINO.hitMargin;
    const x1 = DINO.x + m;
    const x2 = DINO.x + this.currentWidth - m;
    const y1 = this.top + m;
    const y2 = this.top + this.currentHeight - m;
    return this.obstacles.some(
      (o) => x2 > o.x + m && x1 < o.x + o.w - m && y2 > o.y + m && y1 < o.y + o.h - m,
    );
  }
}
