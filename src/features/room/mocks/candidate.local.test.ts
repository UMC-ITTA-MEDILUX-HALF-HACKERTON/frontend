import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Member, Room } from "@features/room/types/room.types";
import { setMyMemberId } from "@features/room/utils/me";

import { localCandidateApi } from "./candidate.local";

function stubBrowserStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  });
}

beforeEach(stubBrowserStorage);
afterEach(() => vi.unstubAllGlobals());

const member = (id: string, nickname: string, isHost = false): Member => ({
  id,
  nickname,
  isHost,
  status: "NEARBY",
  distanceM: null,
  arrivedAt: null,
});

// 서버 모드의 참가자 id 는 숫자 문자열이다.
const room: Room = {
  id: "12",
  code: "ABC123",
  name: "모임",
  place: "장소",
  placeLat: 37.5,
  placeLng: 127,
  appointmentAt: new Date().toISOString(),
  lateGameEnabled: true,
  baseFee: 3000,
  confirmedCandidateId: null,
  members: [member("7", "방장", true), member("8", "참가자")],
};

describe("localCandidateApi (서버 모드 정하기 탭 임시 저장소)", () => {
  it("후보를 더하고 투표하면 득표 수와 미응답 인원이 서버 참가자 기준으로 계산된다", () => {
    localCandidateApi.createCandidate("12", { kind: "PLACE", name: "포차" });
    localCandidateApi.createCandidate("12", { kind: "ACTIVITY", name: "노래방" });
    setMyMemberId("12", "8");
    const [first] = localCandidateApi.getBoard(room).candidates;
    localCandidateApi.putVote(room, { candidateId: first!.id });

    const board = localCandidateApi.getBoard(room);
    expect(board.candidates.map((c) => c.voteCount)).toEqual([1, 0]);
    expect(board.memberCount).toBe(2);
    expect(board.votedCount).toBe(1);
    expect(board.nonVoterIds).toEqual(["7"]);
    expect(board.myVoteCandidateId).toBe(first!.id);
  });

  it("같은 사람이 다시 투표하면 바뀐다", () => {
    localCandidateApi.createCandidate("12", { kind: "PLACE", name: "포차" });
    localCandidateApi.createCandidate("12", { kind: "PLACE", name: "카페" });
    setMyMemberId("12", "8");
    const [a, b] = localCandidateApi.getBoard(room).candidates;
    localCandidateApi.putVote(room, { candidateId: a!.id });
    localCandidateApi.putVote(room, { candidateId: b!.id });
    expect(localCandidateApi.getBoard(room).candidates.map((c) => c.voteCount)).toEqual([0, 1]);
  });

  it("참가자가 아니면 투표할 수 없다", () => {
    localCandidateApi.createCandidate("12", { kind: "PLACE", name: "포차" });
    setMyMemberId("12", "99");
    const [a] = localCandidateApi.getBoard(room).candidates;
    expect(() => localCandidateApi.putVote(room, { candidateId: a!.id })).toThrow();
  });

  it("주최자만 확정할 수 있고, 확정하면 투표가 막힌다", () => {
    localCandidateApi.createCandidate("12", { kind: "PLACE", name: "포차" });
    const [a] = localCandidateApi.getBoard(room).candidates;
    setMyMemberId("12", "8");
    expect(() => localCandidateApi.decide(room, { candidateId: a!.id })).toThrow();

    setMyMemberId("12", "7");
    localCandidateApi.decide(room, { candidateId: a!.id });
    expect(localCandidateApi.getBoard(room).confirmedCandidateId).toBe(a!.id);
    expect(() => localCandidateApi.putVote(room, { candidateId: a!.id })).toThrow();
  });
});
