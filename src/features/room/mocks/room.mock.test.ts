import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_LATE_ROOM_ID, DEMO_ROOM_ID, mockRoomApi } from "./room.mock";
import { getMyMemberId, setMyMemberId } from "@features/room/utils/me";

// 브라우저가 없는 테스트 환경에서 localStorage 를 흉내 낸다.
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

const input = {
  name: "토요일 스터디",
  place: "신촌역 카페",
  date: "2026-11-14",
  time: "19:00",
  lateGameEnabled: true,
  baseFee: 3000,
  nickname: "주최자",
  lat: 37.5559,
  lng: 126.9368,
};

describe("mock 플로우: 모임 만들기부터 확정까지", () => {
  it("만들기, 초대 코드 조회, 입장, 후보, 투표, 확정이 이어진다", async () => {
    // 1. 모임 만들기: 주최자가 등록되고 내가 주최자가 된다
    const created = await mockRoomApi.createRoom(input);
    expect(created.code).toHaveLength(5);
    expect(getMyMemberId(created.roomId)).toBe(created.memberId);
    const room = await mockRoomApi.getRoom(created.roomId);
    expect(room.members).toHaveLength(1);
    expect(room.members[0]).toMatchObject({ id: created.memberId, isHost: true });

    // 2. 초대 코드로 미리보기, 없는 코드는 NOT_FOUND
    expect((await mockRoomApi.getRoomByCode(created.code)).id).toBe(created.roomId);
    await expect(mockRoomApi.getRoomByCode("nope!")).rejects.toMatchObject({ code: "NOT_FOUND" });

    // 3. 입장: 닉네임이 겹치면 DUPLICATE
    const joined = await mockRoomApi.joinRoom({ code: created.code, nickname: "지수" });
    expect(getMyMemberId(created.roomId)).toBe(joined.memberId);
    await expect(
      mockRoomApi.joinRoom({ code: created.code, nickname: "지수" }),
    ).rejects.toMatchObject({ code: "DUPLICATE" });

    // 4. 후보 등록과 투표 (입장한 사람으로)
    await mockRoomApi.createCandidate(created.roomId, { kind: "PLACE", name: "근처 카페" });
    await mockRoomApi.createCandidate(created.roomId, { kind: "ACTIVITY", name: "코인노래방" });
    let board = await mockRoomApi.getCandidates(created.roomId);
    expect(board).toMatchObject({ memberCount: 2, votedCount: 0, myVoteCandidateId: null });
    expect(board.nonVoterIds).toHaveLength(2);

    const [cafe, karaoke] = board.candidates;
    await mockRoomApi.putVote(created.roomId, { candidateId: cafe.id });
    await mockRoomApi.putVote(created.roomId, { candidateId: karaoke.id }); // 1인 1표: 바꾸면 이동
    board = await mockRoomApi.getCandidates(created.roomId);
    expect(board.votedCount).toBe(1);
    expect(board.myVoteCandidateId).toBe(karaoke.id);
    expect(board.candidates.map((c) => c.voteCount)).toEqual([0, 1]);

    // 5. 주최자가 아니면 확정할 수 없다
    await expect(
      mockRoomApi.decideCandidate(created.roomId, { candidateId: karaoke.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // 6. 주최자는 확정할 수 있고, 확정 뒤에는 투표할 수 없다
    setMyMemberId(created.roomId, created.memberId);
    await mockRoomApi.decideCandidate(created.roomId, { candidateId: karaoke.id });
    board = await mockRoomApi.getCandidates(created.roomId);
    expect(board.confirmedCandidateId).toBe(karaoke.id);
    await expect(
      mockRoomApi.putVote(created.roomId, { candidateId: cafe.id }),
    ).rejects.toMatchObject({ code: "DUPLICATE" });
  });

  it("주최자가 도착을 확인하고 취소할 수 있다", async () => {
    const created = await mockRoomApi.createRoom(input);
    const arrivedAt = new Date(2026, 10, 14, 19, 3).toISOString();

    await mockRoomApi.confirmArrival(created.roomId, created.memberId, {
      arrived: true,
      arrivedAt,
    });
    let room = await mockRoomApi.getRoom(created.roomId);
    expect(room.members[0]).toMatchObject({ status: "ARRIVED", arrivedAt });

    await mockRoomApi.confirmArrival(created.roomId, created.memberId, {
      arrived: false,
      arrivedAt: null,
    });
    room = await mockRoomApi.getRoom(created.roomId);
    expect(room.members[0]).toMatchObject({ status: "MOVING", arrivedAt: null });
  });

  it("날짜 형식이 틀리면 INVALID_INPUT", async () => {
    await expect(mockRoomApi.createRoom({ ...input, date: "내일" })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });
});

describe("데모 모임", () => {
  it("약속 전 모임은 아직 아무도 도착하지 않았다", async () => {
    const room = await mockRoomApi.getRoom(DEMO_ROOM_ID);
    expect(room.members.map((m) => m.nickname)).toEqual(["민지", "지수", "철수", "영희"]);
    expect(room.members.some((m) => m.status === "ARRIVED")).toBe(false);
    expect(new Date(room.appointmentAt).getTime()).toBeGreaterThan(Date.now());
    expect(getMyMemberId(DEMO_ROOM_ID)).toBe("m1");
  });

  it("약속 후 모임은 3명이 도착했고 철수만 오는 중이다", async () => {
    const room = await mockRoomApi.getRoom(DEMO_LATE_ROOM_ID);
    expect(new Date(room.appointmentAt).getTime()).toBeLessThan(Date.now());
    expect(room.members.filter((m) => m.status === "ARRIVED")).toHaveLength(3);
    expect(room.members.find((m) => m.nickname === "철수")).toMatchObject({
      status: "MOVING",
      distanceM: 400,
    });
  });
});
