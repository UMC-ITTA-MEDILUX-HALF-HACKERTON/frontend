// 미니게임 모듈의 공개 진입점. 화면에서는 여기서만 import 한다.
export { MiniGame } from "./components/MiniGame/MiniGame.client";
export { useMiniGame } from "./hooks/useMiniGame";
export { createEngine } from "./engines/create-engine";
export { renderGame } from "./engines/render";
export { DEFAULT_THEME } from "./types/minigame.types";
export type {
  GameAction,
  GameStatus,
  MiniGameCallbacks,
  MiniGameEngine,
  MiniGameId,
  MiniGameTheme,
} from "./types/minigame.types";
