import { describe, expect, it } from "vitest";

import { candidateEmoji } from "./candidate-emoji";

describe("candidateEmoji", () => {
  it("이름에 맞는 이모지를 고른다", () => {
    expect(candidateEmoji({ kind: "ACTIVITY", name: "코인노래방" })).toBe("🎤");
    expect(candidateEmoji({ kind: "PLACE", name: "2차 포차" })).toBe("🍻");
    expect(candidateEmoji({ kind: "PLACE", name: "근처 카페" })).toBe("☕");
  });

  it("맞는 말이 없으면 종류로 정한다", () => {
    expect(candidateEmoji({ kind: "PLACE", name: "한강" })).toBe("📍");
    expect(candidateEmoji({ kind: "ACTIVITY", name: "산책" })).toBe("🎲");
  });
});
