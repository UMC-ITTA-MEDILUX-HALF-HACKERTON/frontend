import { USE_MOCK } from "@common/constants/app";
import { localCandidateApi } from "@features/room/mocks/candidate.local";
import { mockRoomApi } from "@features/room/mocks/room.mock";
import {
  createRoomResultSchema,
  gameResultSchema,
  joinRoomResultSchema,
  roomDetailSchema,
} from "@features/room/schemas/room.schema";
import type {
  CandidateBoard,
  ConfirmArrivalInput,
  CreateCandidateInput,
  CreateRoomInput,
  CreateRoomResult,
  DecisionInput,
  GameBoard,
  GameScoreInput,
  JoinRoomInput,
  JoinRoomResult,
  Room,
  VoteInput,
} from "@features/room/types/room.types";
import {
  toArrivalRequest,
  toCreateRoomRequest,
  toGameBoard,
  toRoom,
} from "@features/room/api/room.mapper";
import { apiFetch } from "@lib/api/client";
import { ApiError } from "@lib/api/error";

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
  return apiFetch("/api/rooms", {
    method: "POST",
    body: toCreateRoomRequest(input),
    schema: createRoomResultSchema,
  });
}

// 초대 링크(코드)로 모임 미리보기. 백엔드는 참가자만 모임을 조회할 수 있어서(roomId 로만 조회), 실제 서버에서는 미리보기를 하지 않는다.
// JoinView 는 USE_MOCK 이 아니면 이 호출을 건너뛰고 코드와 닉네임으로 바로 입장한다.
export function getRoomByCode(code: string, signal?: AbortSignal): Promise<Room> {
  if (USE_MOCK) return mockRoomApi.getRoomByCode(code);
  void signal;
  return Promise.reject(new ApiError("코드로 모임을 미리 볼 수 없어요.", 0));
}

// P0 참여 코드 + 닉네임으로 입장, memberId 발급
export function joinRoom(input: JoinRoomInput): Promise<JoinRoomResult> {
  if (USE_MOCK) return mockRoomApi.joinRoom(input);
  return apiFetch("/api/rooms/join", { method: "POST", body: input, schema: joinRoomResultSchema });
}

// P0 모임 정보, 참가자, 약속 시간 조회
export function getRoom(roomId: string, signal?: AbortSignal): Promise<Room> {
  if (USE_MOCK) return mockRoomApi.getRoom(roomId);
  return apiFetch(room(roomId), { schema: roomDetailSchema, signal }).then(toRoom);
}

// P0 GPS 위치 갱신과 참가자 위치 조회는 features/map/api/location.api.ts 에 있다.

// P0 주최자 도착 확인, 실제 도착 시각 수정
// 백엔드에는 도착 취소가 없다 (도착 처리만 있고, 이미 도착한 사람은 시각만 고칠 수 있다).
// TODO(백엔드와 확인): 도착 취소(arrivedAt 비우기) API 가 생기면 arrived=false 를 연결한다.
export async function confirmArrival(
  roomId: string,
  memberId: string,
  input: ConfirmArrivalInput,
): Promise<void> {
  if (USE_MOCK) {
    await mockRoomApi.confirmArrival(roomId, memberId, input);
    return;
  }
  if (!input.arrived) throw new ApiError("도착 취소는 아직 지원하지 않아요.", 0);
  await apiFetch(`${member(roomId, memberId)}/arrival`, {
    method: "PATCH",
    body: toArrivalRequest(input),
  });
}

// 정하기 탭(후보, 투표, 확정)은 서버 API 가 이 화면과 맞지 않아 아직 연결하지 않았다.
// 서버는 투표 주제 + 선택지 2개 이상 구조이고 방장만 만들 수 있다. 서버 모드에서는 이 브라우저에만 저장하는
// 임시 저장소(candidate.local)를 쓰고, 참가자 목록은 서버 모임 정보를 쓴다.

// P0 장소 + 활동 후보 등록
export async function createCandidate(roomId: string, input: CreateCandidateInput): Promise<void> {
  if (USE_MOCK) {
    await mockRoomApi.createCandidate(roomId, input);
    return;
  }
  localCandidateApi.createCandidate(roomId, input);
}

// P0 후보 목록, 투표 수, 미응답 인원 조회
export async function getCandidates(roomId: string, signal?: AbortSignal): Promise<CandidateBoard> {
  if (USE_MOCK) return mockRoomApi.getCandidates(roomId);
  return localCandidateApi.getBoard(await getRoom(roomId, signal));
}

// P0 1인 1표 등록, 변경
export async function putVote(roomId: string, input: VoteInput): Promise<void> {
  if (USE_MOCK) return mockRoomApi.putVote(roomId, input);
  localCandidateApi.putVote(await getRoom(roomId), input);
}

// P0 주최자가 최종 후보 확정
export async function decideCandidate(roomId: string, input: DecisionInput): Promise<void> {
  if (USE_MOCK) {
    await mockRoomApi.decideCandidate(roomId, input);
    return;
  }
  localCandidateApi.decide(await getRoom(roomId), input);
}

// P1 방장이 게임 시작. 이 순간의 참가자가 지각자 팀과 도착자 팀으로 고정된다.
export async function startGame(roomId: string): Promise<void> {
  if (USE_MOCK) return mockRoomApi.startGame(roomId);
  await apiFetch(`${room(roomId)}/game/start`, { method: "POST" });
}

// P1 게임 점수 제출 (한 번만). 응답은 제출 후 결과 전체지만 화면은 결과를 다시 받아 오므로 쓰지 않는다.
export async function submitGameScore(roomId: string, input: GameScoreInput): Promise<void> {
  if (USE_MOCK) return mockRoomApi.submitGameScore(roomId, input);
  await apiFetch(`${room(roomId)}/game/scores`, { method: "POST", body: input });
}

// P1 팀 평균 비교, 승패, 지각비 결과 조회
export function getGameResult(roomId: string, signal?: AbortSignal): Promise<GameBoard> {
  if (USE_MOCK) return mockRoomApi.getGameBoard(roomId);
  return apiFetch(`${room(roomId)}/game/result`, { schema: gameResultSchema, signal }).then(
    toGameBoard,
  );
}

// 투표하지 않은 사람 "콕 찌르기". 명세에 없는 기능이라 mock 에서만 동작하고 실제 연동은 백엔드 확인 후 정한다.
// TODO(백엔드와 확인): 콕 찌르기 API 가 있는지 (웹 푸시 P2 와 연결될 수 있다).
export async function nudgeMember(): Promise<void> {
  if (USE_MOCK) return mockRoomApi.nudge();
  return done();
}
