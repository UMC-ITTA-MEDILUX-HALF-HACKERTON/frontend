import { describe, expect, it } from "vitest";

import type { Member, Room } from "@features/room/types/room.types";

import {
  average,
  buildGameBoard,
  gameTurn,
  isLateTeam,
  judge,
  padScore,
  splitTeams,
  subject,
  type MockGame,
} from "./game";

describe("judge (지각자 팀 평균 vs 도착자 팀 평균)", () => {
  it("높으면 승리, 지각비 0원", () => {
    expect(judge(280, 200, 3000)).toEqual({ outcome: "WIN", fee: 0 });
  });

  it("낮으면 패배, 기본 지각비의 2배", () => {
    expect(judge(150, 200, 3000)).toEqual({ outcome: "LOSE", fee: 6000 });
  });

  it("같으면 무승부, 기본 지각비", () => {
    expect(judge(200, 200, 3000)).toEqual({ outcome: "DRAW", fee: 3000 });
  });

  it("한 팀이라도 낸 사람이 없으면 대기, 기본 지각비", () => {
    expect(judge(null, 200, 3000)).toEqual({ outcome: "PENDING", fee: 3000 });
    expect(judge(200, null, 3000)).toEqual({ outcome: "PENDING", fee: 3000 });
  });

  it("평균이 소수여도 정확히 비교한다", () => {
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

const game = (scores: Record<string, number>, finished = false): MockGame => ({
  lateIds: ["m3"],
  onTimeIds: ["m1", "m2", "m4"],
  scores,
  finished,
});

describe("splitTeams", () => {
  it("도착한 사람은 도착자 팀, 아닌 사람은 지각자 팀", () => {
    expect(splitTeams(room)).toEqual({ lateIds: ["m3"], onTimeIds: ["m1", "m2", "m4"] });
  });
});

describe("buildGameBoard", () => {
  it("시작 전이면 비어 있고 대기 상태", () => {
    const board = buildGameBoard(room, null);
    expect(board.status).toBe("NOT_STARTED");
    expect(board.outcome).toBe("PENDING");
    expect(board.scores).toEqual([]);
  });

  it("지각자 팀이 아직 안 냈으면 결과는 대기", () => {
    const board = buildGameBoard(room, game({ m1: 250, m2: 150, m4: 200 }));
    expect(board.status).toBe("PLAYING");
    expect(board.onTimeAverage).toBe(200);
    expect(board.lateAverage).toBeNull();
    expect(board.outcome).toBe("PENDING");
    expect(board.onTimeSubmittedCount).toBe(3);
    expect(board.lateTotalCount).toBe(1);
  });

  it("두 팀이 모두 내면 평균을 비교해 승패와 지각비가 정해진다", () => {
    const win = buildGameBoard(room, game({ m1: 250, m2: 150, m4: 200, m3: 300 }, true));
    expect(win.status).toBe("FINISHED");
    expect(win.outcome).toBe("WIN");
    expect(win.penaltyPerPerson).toBe(0);
    expect(win.lateMembers).toEqual([
      { memberId: "m3", nickname: "철수", lateMinutes: null, score: 300, penalty: 0 },
    ]);

    const lose = buildGameBoard(room, game({ m1: 250, m2: 150, m4: 200, m3: 100 }, true));
    expect(lose.outcome).toBe("LOSE");
    expect(lose.penaltyPerPerson).toBe(6000);

    const draw = buildGameBoard(room, game({ m1: 250, m2: 150, m4: 200, m3: 200 }, true));
    expect(draw.outcome).toBe("DRAW");
    expect(draw.penaltyPerPerson).toBe(3000);
  });

  it("제출한 점수에 팀이 붙는다", () => {
    const board = buildGameBoard(room, game({ m1: 250, m3: 100 }));
    expect(board.scores).toEqual([
      { memberId: "m1", nickname: "민지", team: "ON_TIME", score: 250 },
      { memberId: "m3", nickname: "철수", team: "LATE", score: 100 },
    ]);
  });
});

describe("gameTurn", () => {
  const notStarted = buildGameBoard(room, null);
  const playing = buildGameBoard(room, game({ m1: 250 }));
  const finished = buildGameBoard(room, game({ m1: 250, m2: 150, m4: 200, m3: 300 }, true));

  it("시작 전에는 방장만 시작할 수 있고 나머지는 기다린다", () => {
    expect(gameTurn(room, notStarted, "m1")).toBe("START");
    expect(gameTurn(room, notStarted, "m3")).toBe("WAIT_START");
  });

  it("모두 도착했으면 게임이 없다", () => {
    const all = {
      ...room,
      members: room.members.map((m) => ({ ...m, status: "ARRIVED" as const })),
    };
    expect(gameTurn(all, buildGameBoard(all, null), "m1")).toBe("NO_GAME");
  });

  it("진행 중에는 아직 점수를 내지 않은 사람이 할 수 있고, 낸 사람은 끝", () => {
    expect(gameTurn(room, playing, "m1")).toBe("DONE");
    expect(gameTurn(room, playing, "m2")).toBe("PLAY");
    expect(gameTurn(room, playing, "m3")).toBe("PLAY");
  });

  it("끝난 게임은 모두 끝", () => {
    expect(gameTurn(room, finished, "m2")).toBe("DONE");
  });

  it("참가자가 아니면 할 수 없다", () => {
    expect(gameTurn(room, playing, "m9")).toBe("NOT_MEMBER");
    expect(gameTurn(room, playing, null)).toBe("NOT_MEMBER");
  });
});

describe("isLateTeam", () => {
  it("시작 전에는 도착 여부로, 시작 후에는 서버가 정한 지각자 목록으로 판단한다", () => {
    const [m1, , m3] = room.members;
    const before = buildGameBoard(room, null);
    expect(isLateTeam(m3!, before)).toBe(true);
    expect(isLateTeam(m1!, before)).toBe(false);
    const started = buildGameBoard(room, game({}));
    expect(isLateTeam(m3!, started)).toBe(true);
    expect(isLateTeam(m1!, started)).toBe(false);
  });
});

describe("padScore", () => {
  it("다섯 자리로 채운다", () => {
    expect(padScore(250)).toBe("00250");
    expect(padScore(-3)).toBe("00000");
  });
});

describe("subject", () => {
  it("받침에 따라 이/가를 붙인다", () => {
    expect(subject("철수")).toBe("철수가");
    expect(subject("민준")).toBe("민준이");
    expect(subject("Amy")).toBe("Amy가");
  });
});
