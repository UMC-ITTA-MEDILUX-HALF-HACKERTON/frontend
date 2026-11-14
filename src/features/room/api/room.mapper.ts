import type { CreateRoomInput, Member, Room } from "@features/room/types/room.types";

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
