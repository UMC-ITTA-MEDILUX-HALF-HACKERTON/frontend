import type { z } from "zod";

import type { gameResultSchema } from "@features/room/schemas/room.schema";
import type {
  ConfirmArrivalInput,
  CreateRoomInput,
  GameBoard,
  Member,
  Room,
} from "@features/room/types/room.types";
import { toDateInput } from "@features/room/utils/time";

// 백엔드 DTO 와 화면 모델 사이의 변환. 백엔드는 id 가 숫자(Long)이고 시각은 시간대 없는 LocalDateTime 이다.

// 백엔드 모임 생성 요청 (CreateRoomRequest)
export interface CreateRoomRequestBody {
  title: string;
  placeName: string;
  lat: number;
  lng: number;
  startAt: string;
  lateFee: number;
  nickname: string;
}

// "YYYY-MM-DD" + "HH:mm" 을 LocalDateTime 문자열("YYYY-MM-DDTHH:mm:00")로 만든다. 시간대는 붙이지 않는다(서버는 Asia/Seoul).
export function toStartAt(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function toCreateRoomRequest(input: CreateRoomInput): CreateRoomRequestBody {
  return {
    title: input.name,
    placeName: input.place,
    lat: input.lat,
    lng: input.lng,
    startAt: toStartAt(input.date, input.time),
    // 지각비 게임을 끄면 지각비를 받지 않는다. 백엔드에는 게임 사용 여부 필드가 없다.
    lateFee: input.lateGameEnabled ? input.baseFee : 0,
    nickname: input.nickname,
  };
}

// 백엔드 도착 처리 요청 (ArrivalRequest). arrivedAt 이 null 이면 서버 현재 시각으로 기록한다.
export interface ArrivalRequestBody {
  arrivedAt: string | null;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

// ISO 시각을 시간대 없는 로컬 시각("YYYY-MM-DDTHH:mm:ss")으로 바꾼다. 백엔드 LocalDateTime 은 "Z" 가 붙은 값을 받지 못한다.
// 올바르지 않은 값이면 null (서버가 현재 시각으로 기록한다).
export function toLocalDateTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${toDateInput(date)}T${time}`;
}

export function toArrivalRequest(input: ConfirmArrivalInput): ArrivalRequestBody {
  return { arrivedAt: input.arrivedAt ? toLocalDateTime(input.arrivedAt) : null };
}

// 백엔드 모임 상세 응답 (RoomDetailResponse)
export interface RoomDetailDto {
  roomId: number | string;
  code: string;
  title: string;
  placeName: string;
  lat: number;
  lng: number;
  startAt: string;
  lateFee: number;
  createdAt: string;
  members: MemberDto[];
}

export interface MemberDto {
  memberId: number | string;
  nickname: string;
  role: "HOST" | "MEMBER" | string;
  arrivedAt: string | null;
  lateMinutes: number | null;
}

export function toMember(dto: MemberDto): Member {
  return {
    id: String(dto.memberId),
    nickname: dto.nickname,
    isHost: dto.role === "HOST",
    // 위치 상태(근처, GPS 끔)는 백엔드가 아직 주지 않는다. 도착 전은 이동 중으로 본다.
    status: dto.arrivedAt ? "ARRIVED" : "MOVING",
    distanceM: null,
    arrivedAt: dto.arrivedAt,
  };
}

export function toRoom(dto: RoomDetailDto): Room {
  return {
    id: String(dto.roomId),
    code: dto.code,
    name: dto.title,
    place: dto.placeName,
    placeLat: dto.lat,
    placeLng: dto.lng,
    appointmentAt: dto.startAt,
    lateGameEnabled: dto.lateFee > 0,
    baseFee: dto.lateFee,
    members: dto.members.map(toMember),
    // 최종 후보 확정은 투표(poll) 연동 단계에서 채운다.
    confirmedCandidateId: null,
  };
}

// 백엔드 게임 결과 -> 화면 모델. 필드 이름만 다르다 (result -> outcome).
export function toGameBoard(dto: z.infer<typeof gameResultSchema>): GameBoard {
  const { result, ...rest } = dto;
  return { ...rest, outcome: result };
}
