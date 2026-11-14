import { describe, expect, it } from "vitest";

import { DinoEngine } from "./dino.engine";
import { FlappyEngine } from "./flappy.engine";

const fixed = () => 0.5;

function run(engine: { update(dt: number): void }, ms: number) {
  for (let t = 0; t < ms; t += 16) engine.update(16);
}

describe("FlappyEngine", () => {
  it("첫 입력 전에는 움직이지 않는다", () => {
    const e = new FlappyEngine(fixed);
    const y = e.birdY;
    run(e, 500);
    expect(e.status).toBe("ready");
    expect(e.birdY).toBe(y);
  });

  it("입력하면 시작하고 위로 뜬다", () => {
    const e = new FlappyEngine(fixed);
    e.press("primary");
    e.update(16);
    expect(e.status).toBe("playing");
    expect(e.birdVy).toBeLessThan(0);
  });

  it("가만히 두면 떨어져서 끝난다", () => {
    const e = new FlappyEngine(fixed);
    e.press("primary");
    run(e, 5000);
    expect(e.status).toBe("over");
  });

  it("reset 후에도 최고점은 유지된다", () => {
    const e = new FlappyEngine(fixed);
    e.highScore = 7;
    e.reset();
    expect(e.highScore).toBe(7);
    expect(e.status).toBe("ready");
  });
});

describe("DinoEngine", () => {
  it("점프하면 공중에 떴다가 착지한다", () => {
    const e = new DinoEngine(fixed);
    e.press("primary");
    e.update(16);
    expect(e.airborne).toBe(true);
    run(e, 1000);
    expect(e.airborne || e.status === "over").toBe(false);
  });

  it("아무것도 안 하면 장애물에 부딪혀 끝난다", () => {
    const e = new DinoEngine(fixed);
    e.press("primary");
    run(e, 20000);
    expect(e.status).toBe("over");
  });

  it("속도는 최대치를 넘지 않는다", () => {
    const e = new DinoEngine(fixed);
    e.status = "playing";
    for (let i = 0; i < 5000; i++) {
      e.obstacles = [];
      e.update(16);
    }
    expect(e.speed).toBeLessThanOrEqual(720);
  });
});
