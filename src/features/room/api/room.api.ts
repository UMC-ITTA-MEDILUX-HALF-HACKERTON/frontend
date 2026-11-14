import { USE_MOCK } from "@common/constants/app";
import { mockRoomApi } from "@features/room/mocks/room.mock";
import {
  candidateBoardSchema,
  createRoomResultSchema,
  gameBoardSchema,
  joinRoomResultSchema,
  roomSchema,
} from "@features/room/schemas/room.schema";
import type {
  CandidateBoard,
  ConfirmArrivalInput,
  CreateCandidateInput,
  CreateRoomInput,
  CreateRoomResult,
  DecisionInput,
  Dto,
  GameBoard,
  GameScoreInput,
  JoinRoomInput,
  JoinRoomResult,
  Room,
  UpdateLocationInput,
  VoteInput,
} from "@features/room/types/room.types";
import { apiFetch } from "@lib/api/client";

// 경로와 메서드는 백엔드 API 명세서 그대로다. NEXT_PUBLIC_USE_MOCK=true 이면 백엔드 대신 mock 을 쓴다.
// TODO(백엔드 DTO 확정 후): 실제 응답이 schemas/room.schema.ts 와 다르면 여기서 화면 모델로 바꿔 준다.
// roomId, memberId 는 경로에 들어가므로 encodeURIComponent 로 감싼다.
const room = (roomId: string) => `/api/rooms/${encodeURIComponent(roomId)}`;
const member = (roomId: string, memberId: string) =>
  `${room(roomId)}/members/${encodeURIComponent(memberId)}`;
const done = (): void => undefined;

// P0 모임 생성 + 참여 코드 발급 + 주최자 등록
export function createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
  if (USE_MOCK) return mockRoomApi.createRoom(input);
  return apiFetch("/api/rooms", { method: "POST", body: input, schema: createRoomResultSchema });
}

// 초대 링크(코드)로 모임 미리보기. 명세에 없는 API 라서 모임 조회(GET /api/rooms/{roomId})에 코드를 넣는 것으로 가정한다.
// TODO(백엔드와 확인): 코드로 모임을 조회하는 API 가 따로 있는지.
export function getRoomByCode(code: string, signal?: AbortSignal): Promise<Room> {
  if (USE_MOCK) return mockRoomApi.getRoomByCode(code);
  return apiFetch(room(code), { schema: roomSchema, signal });
}

// P0 참여 코드 + 닉네임으로 입장, memberId 발급
export function joinRoom(input: JoinRoomInput): Promise<JoinRoomResult> {
  if (USE_MOCK) return mockRoomApi.joinRoom(input);
  return apiFetch("/api/rooms/join", { method: "POST", body: input, schema: joinRoomResultSchema });
}

// P0 모임 정보, 참가자, 약속 시간 조회
export function getRoom(roomId: string, signal?: AbortSignal): Promise<Room> {
  if (USE_MOCK) return mockRoomApi.getRoom(roomId);
  return apiFetch(room(roomId), { schema: roomSchema, signal });
}

// P0 GPS 위치 갱신, 직선 거리, 100m 판정 (화면은 아직 쓰지 않는다)
export function updateLocation(
  roomId: string,
  memberId: string,
  input: UpdateLocationInput,
): Promise<Dto> {
  return apiFetch(`${member(roomId, memberId)}/location`, { method: "PATCH", body: input });
}

// P0 주최자 도착 확인, 실제 도착 시각 수정
export async function confirmArrival(
  roomId: string,
  memberId: string,
  input: ConfirmArrivalInput,
): Promise<void> {
  if (USE_MOCK) {
    await mockRoomApi.confirmArrival(roomId, memberId, input);
    return;
  }
  await apiFetch(`${member(roomId, memberId)}/arrival`, { method: "PATCH", body: input });
}

// P0 장소 + 활동 후보 등록
export async function createCandidate(roomId: string, input: CreateCandidateInput): Promise<void> {
  if (USE_MOCK) {
    await mockRoomApi.createCandidate(roomId, input);
    return;
  }
  await apiFetch(`${room(roomId)}/candidates`, { method: "POST", body: input });
}

// P0 후보 목록, 투표 수, 미응답 인원 조회
export function getCandidates(roomId: string, signal?: AbortSignal): Promise<CandidateBoard> {
  if (USE_MOCK) return mockRoomApi.getCandidates(roomId);
  return apiFetch(`${room(roomId)}/candidates`, { schema: candidateBoardSchema, signal });
}

// P0 1인 1표 등록, 변경
export async function putVote(roomId: string, input: VoteInput): Promise<void> {
  if (USE_MOCK) return mockRoomApi.putVote(roomId, input);
  await apiFetch(`${room(roomId)}/votes`, { method: "PUT", body: input });
}

// P0 주최자가 최종 후보 확정
export async function decideCandidate(roomId: string, input: DecisionInput): Promise<void> {
  if (USE_MOCK) {
    await mockRoomApi.decideCandidate(roomId, input);
    return;
  }
  await apiFetch(`${room(roomId)}/decision`, { method: "PATCH", body: input });
}

// P1 게임 점수 제출
// TODO(백엔드 DTO 확정 후): 요청 본문(score)과 이미 점수를 낸 경우의 오류 코드를 확인한다.
export async function submitGameScore(roomId: string, input: GameScoreInput): Promise<void> {
  if (USE_MOCK) return mockRoomApi.submitGameScore(roomId, input);
  await apiFetch(`${room(roomId)}/game/scores`, { method: "POST", body: input });
}

// P1 점수 비교, 승패, 지각비 결과 조회
// TODO(백엔드 DTO 확정 후): 응답이 GameBoard 와 다르면 여기서 바꿔 준다.
export function getGameResult(roomId: string, signal?: AbortSignal): Promise<GameBoard> {
  if (USE_MOCK) return mockRoomApi.getGameBoard(roomId);
  return apiFetch(`${room(roomId)}/game/result`, { schema: gameBoardSchema, signal });
}

// 투표하지 않은 사람 "콕 찌르기". 명세에 없는 기능이라 mock 에서만 동작하고 실제 연동은 백엔드 확인 후 정한다.
// TODO(백엔드와 확인): 콕 찌르기 API 가 있는지 (웹 푸시 P2 와 연결될 수 있다).
export async function nudgeMember(): Promise<void> {
  if (USE_MOCK) return mockRoomApi.nudge();
  return done();
}
