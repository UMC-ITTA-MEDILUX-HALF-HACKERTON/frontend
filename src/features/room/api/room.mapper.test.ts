import { describe, expect, it } from "vitest";

import {
  toArrivalRequest,
  toCreateRoomRequest,
  toLocalDateTime,
  toRoom,
  toStartAt,
} from "@features/room/api/room.mapper";
import {
  createRoomResultSchema,
  joinRoomResultSchema,
  roomDetailSchema,
} from "@features/room/schemas/room.schema";

describe("방 생성 요청 변환", () => {
  const input = {
    name: "금요일 모임",
    place: "강남역",
    lat: 37.4979,
    lng: 127.0276,
    date: "2026-11-20",
    time: "19:00",
    lateGameEnabled: true,
    baseFee: 3000,
    nickname: "민수",
  };

  it("화면 입력을 백엔드 필드로 바꾼다", () => {
    expect(toCreateRoomRequest(input)).toEqual({
      title: "금요일 모임",
      placeName: "강남역",
      lat: 37.4979,
      lng: 127.0276,
      startAt: "2026-11-20T19:00:00",
      lateFee: 3000,
      nickname: "민수",
    });
  });

  it("지각비 게임을 끄면 지각비는 0 이다", () => {
    expect(toCreateRoomRequest({ ...input, lateGameEnabled: false }).lateFee).toBe(0);
  });

  it("시각에는 시간대를 붙이지 않는다", () => {
    expect(toStartAt("2026-11-20", "09:05")).toBe("2026-11-20T09:05:00");
  });
});

describe("방 응답 변환", () => {
  it("숫자 id 를 문자열로 받고 token 을 보존한다", () => {
    expect(
      createRoomResultSchema.parse({ roomId: 1, code: "A7K2QZ", memberId: 1, token: "t" }),
    ).toEqual({ roomId: "1", code: "A7K2QZ", memberId: "1", token: "t" });
    expect(joinRoomResultSchema.parse({ roomId: 1, memberId: 2, token: "t2" })).toEqual({
      roomId: "1",
      memberId: "2",
      token: "t2",
    });
  });

  it("모임 상세를 화면 모델로 바꾼다", () => {
    const dto = roomDetailSchema.parse({
      roomId: 1,
      code: "A7K2QZ",
      title: "금요일 모임",
      placeName: "강남역",
      lat: 37.4979,
      lng: 127.0276,
      startAt: "2026-11-20T19:00:00",
      lateFee: 1000,
      createdAt: "2026-11-14T12:00:00",
      members: [
        { memberId: 1, nickname: "민수", role: "HOST", arrivedAt: null, lateMinutes: null },
        {
          memberId: 2,
          nickname: "지영",
          role: "MEMBER",
          arrivedAt: "2026-11-20T19:05:00",
          lateMinutes: 5,
        },
      ],
    });
    const room = toRoom(dto);
    expect(room).toMatchObject({
      id: "1",
      name: "금요일 모임",
      place: "강남역",
      placeLat: 37.4979,
      placeLng: 127.0276,
      appointmentAt: "2026-11-20T19:00:00",
      lateGameEnabled: true,
      baseFee: 1000,
      confirmedCandidateId: null,
    });
    expect(room.members.map((m) => [m.id, m.isHost, m.status])).toEqual([
      ["1", true, "MOVING"],
      ["2", false, "ARRIVED"],
    ]);
  });
});

describe("도착 처리 요청 변환", () => {
  it("UTC ISO 를 시간대 없는 로컬 시각으로 바꾼다", () => {
    const iso = new Date(2026, 10, 20, 19, 5, 30).toISOString();
    expect(toLocalDateTime(iso)).toBe("2026-11-20T19:05:30");
  });

  it("올바르지 않은 시각은 null 이다", () => {
    expect(toLocalDateTime("not-a-date")).toBeNull();
  });

  it("도착 시각이 없으면 서버 현재 시각에 맡긴다", () => {
    expect(toArrivalRequest({ arrived: true, arrivedAt: null })).toEqual({ arrivedAt: null });
  });

  it("도착 시각을 로컬 시각으로 보낸다", () => {
    const iso = new Date(2026, 10, 20, 9, 5, 0).toISOString();
    expect(toArrivalRequest({ arrived: true, arrivedAt: iso })).toEqual({
      arrivedAt: "2026-11-20T09:05:00",
    });
  });
});
