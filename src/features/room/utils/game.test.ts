import { describe, expect, it } from "vitest";

import type { Member, Room } from "@features/room/types/room.types";

import {
  average,
  buildGameBoard,
  gameTurn,
  judge,
  padScore,
  pickLateMemberId,
  subject,
} from "./game";

describe("judge (지각자 점수 vs 도착자 평균)", () => {
  it("높으면 승리, 지각비 0원", () => {
    expect(judge(280, 200, 3000)).toEqual({ outcome: "WIN", fee: 0 });
  });

  it("낮으면 패배, 기본 지각비의 2배", () => {
    expect(judge(150, 200, 3000)).toEqual({ outcome: "LOSE", fee: 6000 });
  });

  it("같으면 무승부, 기본 지각비", () => {
    expect(judge(200, 200, 3000)).toEqual({ outcome: "DRAW", fee: 3000 });
  });

  it("평균이 소수여도 정확히 비교한다", () => {
    // (250 + 150 + 200) / 3 = 200, (250 + 150 + 201) / 3 = 200.33...
    expect(judge(200, 601 / 3, 1000).outcome).toBe("LOSE");
  });
});

describe("average", () => {
  it("평균을 구하고 비어 있으면 null", () => {
    expect(average([250, 200, 150])).toBe(200);
    expect(average([])).toBeNull();
  });
});

function member(id: string, nickname: string, status: Member["status"]): Member {
  return { id, nickname, isHost: id === "m1", status, distanceM: null, arrivedAt: null };
}

const room: Room = {
  id: "r",
  code: "c",
  name: "모임",
  place: "장소",
  placeLat: null,
  placeLng: null,
  appointmentAt: new Date().toISOString(),
  lateGameEnabled: true,
  baseFee: 3000,
  confirmedCandidateId: null,
  members: [
    member("m1", "민지", "ARRIVED"),
    member("m2", "지수", "ARRIVED"),
    member("m3", "철수", "MOVING"),
    member("m4", "영희", "ARRIVED"),
  ],
};

describe("pickLateMemberId", () => {
  it("도착하지 않은 첫 사람을 지각자로 고른다", () => {
    expect(pickLateMemberId(room)).toBe("m3");
  });

  it("모두 도착했으면 null", () => {
    const all = {
      ...room,
      members: room.members.map((m) => ({ ...m, status: "ARRIVED" as const })),
    };
    expect(pickLateMemberId(all)).toBeNull();
  });
});

describe("buildGameBoard", () => {
  it("도착자 점수만으로 평균을 만들고, 지각자 점수가 없으면 결과는 아직 없다", () => {
    const board = buildGameBoard(room, [
      { memberId: "m1", score: 250 },
      { memberId: "m2", score: 150 },
      { memberId: "m4", score: 200 },
    ]);
    expect(board).toMatchObject({
      lateMemberId: "m3",
      arrivedCount: 3,
      arrivedAverage: 200,
      lateScore: null,
      outcome: null,
      fee: null,
    });
  });

  it("지각자가 점수를 내면 승패와 지각비가 나온다", () => {
    const base = [
      { memberId: "m1", score: 250 },
      { memberId: "m2", score: 150 },
      { memberId: "m4", score: 200 },
    ];
    expect(buildGameBoard(room, [...base, { memberId: "m3", score: 280 }])).toMatchObject({
      outcome: "WIN",
      fee: 0,
    });
    expect(buildGameBoard(room, [...base, { memberId: "m3", score: 150 }])).toMatchObject({
      outcome: "LOSE",
      fee: 6000,
    });
    expect(buildGameBoard(room, [...base, { memberId: "m3", score: 200 }])).toMatchObject({
      outcome: "DRAW",
      fee: 3000,
    });
  });
});

describe("gameTurn", () => {
  const scored = (ids: string[]) => ids.map((memberId) => ({ memberId, score: 100 }));

  it("도착자는 아직 점수를 내지 않았으면 플레이할 수 있다", () => {
    expect(gameTurn(room, buildGameBoard(room, []), "m1")).toBe("PLAY");
  });

  it("점수를 이미 냈으면 DONE", () => {
    expect(gameTurn(room, buildGameBoard(room, scored(["m1"])), "m1")).toBe("DONE");
  });

  it("지각자는 도착자가 모두 끝난 뒤에만 플레이할 수 있다", () => {
    expect(gameTurn(room, buildGameBoard(room, scored(["m1", "m2"])), "m3")).toBe("WAIT_ARRIVED");
    expect(gameTurn(room, buildGameBoard(room, scored(["m1", "m2", "m4"])), "m3")).toBe("PLAY");
  });

  it("참가자가 아니면 NOT_MEMBER, 모두 도착했으면 NO_GAME", () => {
    expect(gameTurn(room, buildGameBoard(room, []), "zzz")).toBe("NOT_MEMBER");
    expect(gameTurn(room, buildGameBoard(room, []), null)).toBe("NOT_MEMBER");
    const all = {
      ...room,
      members: room.members.map((m) => ({ ...m, status: "ARRIVED" as const })),
    };
    expect(gameTurn(all, buildGameBoard(all, []), "m1")).toBe("NO_GAME");
  });

  it("지각자로 뽑히지 않은 미도착자는 구경만 한다", () => {
    const two = {
      ...room,
      members: [...room.members, member("m5", "민수", "MOVING")],
    };
    expect(gameTurn(two, buildGameBoard(two, []), "m5")).toBe("SPECTATOR");
  });
});

describe("subject", () => {
  it("받침에 따라 이 또는 가를 붙인다", () => {
    expect(subject("철수")).toBe("철수가");
    expect(subject("민준")).toBe("민준이");
    expect(subject("Amy")).toBe("Amy가");
  });
});

describe("padScore", () => {
  it("점수를 다섯 자리로 채운다", () => {
    expect(padScore(250)).toBe("00250");
    expect(padScore(0)).toBe("00000");
    expect(padScore(12.9)).toBe("00012");
  });

  it("음수는 0으로 본다", () => {
    expect(padScore(-5)).toBe("00000");
  });
});

describe("도착한 사람이 없는 모임 (방금 만든 모임)", () => {
  const nobody: Room = {
    ...room,
    members: [member("m1", "민지", "NEARBY"), member("m2", "지수", "MOVING")],
  };

  it("비교할 도착자 평균이 없으므로 지각자도 게임을 시작할 수 없다", () => {
    const board = buildGameBoard(nobody, []);
    expect(board.arrivedCount).toBe(0);
    expect(gameTurn(nobody, board, "m1")).toBe("WAIT_ARRIVED");
  });

  it("도착자가 없으면 점수를 내도 결과가 정해지지 않는다 (그래서 시작 자체를 막는다)", () => {
    expect(buildGameBoard(nobody, [{ memberId: "m1", score: 100 }]).outcome).toBeNull();
  });
});
