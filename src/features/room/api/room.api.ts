import type {
  ConfirmArrivalInput,
  CreateCandidateInput,
  CreateRoomInput,
  DecisionInput,
  Dto,
  GameScoreInput,
  JoinRoomInput,
  UpdateLocationInput,
  VoteInput,
} from "@features/room/types/room.types";
import { apiFetch } from "@lib/api/client";

// 경로와 메서드는 백엔드 API 명세서 그대로다. 요청, 응답 필드는 DTO 확정 후 타입과 스키마를 붙인다.
// roomId, memberId 는 경로에 들어가므로 encodeURIComponent 로 감싼다.
const room = (roomId: string) => `/api/rooms/${encodeURIComponent(roomId)}`;
const member = (roomId: string, memberId: string) =>
  `${room(roomId)}/members/${encodeURIComponent(memberId)}`;

// P0 모임 생성 + 참여 코드 발급 + 주최자 등록
export function createRoom(input: CreateRoomInput): Promise<Dto> {
  return apiFetch("/api/rooms", { method: "POST", body: input });
}

// P0 참여 코드 + 닉네임으로 입장, memberId 발급
export function joinRoom(input: JoinRoomInput): Promise<Dto> {
  return apiFetch("/api/rooms/join", { method: "POST", body: input });
}

// P0 모임 정보, 참가자, 약속 시간 조회
export function getRoom(roomId: string, signal?: AbortSignal): Promise<Dto> {
  return apiFetch(room(roomId), { signal });
}

// P0 GPS 위치 갱신, 직선 거리, 100m 판정
export function updateLocation(
  roomId: string,
  memberId: string,
  input: UpdateLocationInput,
): Promise<Dto> {
  return apiFetch(`${member(roomId, memberId)}/location`, { method: "PATCH", body: input });
}

// P0 주최자 도착 확인, 실제 도착 시각 수정
export function confirmArrival(
  roomId: string,
  memberId: string,
  input: ConfirmArrivalInput,
): Promise<Dto> {
  return apiFetch(`${member(roomId, memberId)}/arrival`, { method: "PATCH", body: input });
}

// P0 장소 + 활동 후보 등록
export function createCandidate(roomId: string, input: CreateCandidateInput): Promise<Dto> {
  return apiFetch(`${room(roomId)}/candidates`, { method: "POST", body: input });
}

// P0 후보 목록, 투표 수, 미응답 인원 조회
export function getCandidates(roomId: string, signal?: AbortSignal): Promise<Dto> {
  return apiFetch(`${room(roomId)}/candidates`, { signal });
}

// P0 1인 1표 등록, 변경
export function putVote(roomId: string, input: VoteInput): Promise<Dto> {
  return apiFetch(`${room(roomId)}/votes`, { method: "PUT", body: input });
}

// P0 주최자가 최종 후보 확정
export function decideCandidate(roomId: string, input: DecisionInput): Promise<Dto> {
  return apiFetch(`${room(roomId)}/decision`, { method: "PATCH", body: input });
}

// P1 게임 점수 제출
export function submitGameScore(roomId: string, input: GameScoreInput): Promise<Dto> {
  return apiFetch(`${room(roomId)}/game/scores`, { method: "POST", body: input });
}

// P1 점수 비교, 승패, 지각비 결과 조회
export function getGameResult(roomId: string, signal?: AbortSignal): Promise<Dto> {
  return apiFetch(`${room(roomId)}/game/result`, { signal });
}
