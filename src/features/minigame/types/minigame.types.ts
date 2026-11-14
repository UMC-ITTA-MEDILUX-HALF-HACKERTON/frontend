// 미니게임 공통 타입. 화면(디자인)과 무관하게 엔진만 다룬다.

export type MiniGameId = "flappy" | "dino";

export type GameStatus = "ready" | "playing" | "over";

// primary: 점프/날갯짓(스페이스, ↑, 탭), duck: 숙이기(↓, 공룡만 사용)
export type GameAction = "primary" | "duck";

export interface MiniGameTheme {
  background: string;
  foreground: string; // 주요 오브젝트(공룡, 파이프, 장애물)
  accent: string; // 새
  ground: string;
  text: string;
}

export const DEFAULT_THEME: MiniGameTheme = {
  background: "#f7f7f7",
  foreground: "#535353",
  accent: "#f5a623",
  ground: "#d9d9d9",
  text: "#535353",
};

// 모든 게임 엔진이 지켜야 하는 형태. 렌더링은 엔진 밖(render.ts)에서 한다.
export interface MiniGameEngine {
  readonly id: MiniGameId;
  readonly width: number; // 논리 좌표계 크기 (px)
  readonly height: number;
  readonly status: GameStatus;
  readonly score: number;
  highScore: number;
  press(action: GameAction): void;
  release(action: GameAction): void;
  update(dtMs: number): void; // 프레임마다 호출. 큰 dt 는 내부에서 잘라 쓴다.
  reset(): void; // ready 상태로 되돌린다 (highScore 는 유지)
}

export interface MiniGameCallbacks {
  onScore?: (score: number) => void;
  onGameOver?: (result: { game: MiniGameId; score: number; highScore: number }) => void;
}

export type Rng = () => number; // [0, 1)
