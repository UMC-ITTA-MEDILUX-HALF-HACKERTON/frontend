import type { MiniGameEngine, MiniGameId, Rng } from "../types/minigame.types";
import { DinoEngine } from "./dino.engine";
import { FlappyEngine } from "./flappy.engine";

export function createEngine(game: MiniGameId, rng?: Rng): MiniGameEngine {
  return game === "flappy" ? new FlappyEngine(rng) : new DinoEngine(rng);
}
