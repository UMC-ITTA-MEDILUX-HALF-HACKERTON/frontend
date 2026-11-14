// 화면이 쓰는 모임 도메인 모델. 백엔드 DTO 가 확정되면 api 계층에서 이 모양으로 바꿔 준다.
// TODO(백엔드 DTO 확정 후): 실제 응답 필드에 맞춰 schemas/room.schema.ts 를 고친다.

import type { MemberGps } from "@features/map/types/location.types";

export type Dto = Record<string, unknown>;

// 위치 상태. 장소 100m 안이면 NEARBY, 이동 중이면 MOVING, 위치 공유를 껐으면 GPS_OFF, 도착이 확인되면 ARRIVED.
export type MemberStatus = "NEARBY" | "MOVING" | "GPS_OFF" | "ARRIVED";

export interface Member {
  id: string;
  nickname: string;
  isHost: boolean;
  status: MemberStatus;
  // 약속 장소까지 직선 거리(m). 모르면 null.
  distanceM: number | null;
  // 주최자가 확인한 실제 도착 시각(ISO). 도착 전이면 null.
  arrivedAt: string | null;
  // 위치 공유 상세 (공유 중, 장소 근처 GPS 꺼짐, 미공유, 오래된 위치). 위치 조회 전이면 없다.
  gps?: MemberGps;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  place: string;
  // 최초 약속 장소 좌표. 지도 중심과 직선 거리·100m 판정의 기준이다. 장소명만으로는 판정하지 않는다.
  // TODO(백엔드 DTO 확정 후): 필드 이름을 맞춘다. 좌표를 아직 받지 못하면 null 이고 지도 대신 안내를 보여 준다.
  placeLat: number | null;
  placeLng: number | null;
  // 약속 시각(ISO)
  appointmentAt: string;
  lateGameEnabled: boolean;
  baseFee: number;
  members: Member[];
  confirmedCandidateId: string | null;
}

export type CandidateKind = "PLACE" | "ACTIVITY";

export interface Candidate {
  id: string;
  kind: CandidateKind;
  name: string;
  mapLink: string | null;
  voteCount: number;
}

export interface CandidateBoard {
  candidates: Candidate[];
  memberCount: number;
  votedCount: number;
  // 아직 투표하지 않은 참가자 id
  nonVoterIds: string[];
  // 내가 투표한 후보 id. 아직이면 null.
  myVoteCandidateId: string | null;
  confirmedCandidateId: string | null;
}

export interface CreateRoomInput {
  name: string;
  place: string;
  // "YYYY-MM-DD", "HH:mm" (브라우저 로컬 시간)
  date: string;
  time: string;
  lateGameEnabled: boolean;
  baseFee: number;
  // 방장 닉네임
  nickname: string;
  // 약속 장소 좌표 (장소 검색으로 고른 값)
  lat: number;
  lng: number;
}

// 응답: 모임 id, 초대 코드, 주최자로 등록된 memberId, 이후 요청에 쓸 참가자 토큰(mock 에는 없다)
export interface CreateRoomResult {
  roomId: string;
  code: string;
  memberId: string;
  token?: string;
}

export interface JoinRoomInput {
  code: string;
  nickname: string;
}

export interface JoinRoomResult {
  roomId: string;
  memberId: string;
  token?: string;
}

export interface CreateCandidateInput {
  kind: CandidateKind;
  name: string;
  mapLink?: string;
  // 활동의 예상 시간(분). 화면에서만 고르고 아직 백엔드 모델에는 없다 (mock 은 저장하지 않는다).
  expectedMinutes?: number;
}

export interface VoteInput {
  candidateId: string;
}

export interface DecisionInput {
  candidateId: string;
}

// 주최자의 도착 확인. arrived 가 false 이면 도착 취소(arrivedAt 은 null).
export interface ConfirmArrivalInput {
  arrived: boolean;
  arrivedAt: string | null;
}

// 지각비 게임 (T-Rex). 방장이 시작하면 그 순간의 참가자가 지각자 팀과 도착자 팀으로 나뉘고,
// 각자 점수를 한 번 내서 두 팀의 평균을 비교한다. 비교와 지각비 계산은 서버가 한다.
export type GameStatus = "NOT_STARTED" | "PLAYING" | "FINISHED";
export type GameTeam = "LATE" | "ON_TIME";
// 지각자 팀 기준 결과. 한 팀이라도 제출자가 없으면 PENDING.
export type GameOutcome = "WIN" | "LOSE" | "DRAW" | "PENDING";

export interface GameScore {
  memberId: string;
  nickname: string;
  team: GameTeam;
  score: number;
}

export interface GameLateMember {
  memberId: string;
  nickname: string;
  // 현재 지각 분. 아직 도착하지 않았으면 null.
  lateMinutes: number | null;
  score: number | null;
  // 이 지각자가 내야 하는 지각비
  penalty: number;
}

export interface GameScoreInput {
  score: number;
}

export interface GameBoard {
  status: GameStatus;
  // 팀 평균. 제출자가 없으면 null.
  lateAverage: number | null;
  onTimeAverage: number | null;
  lateSubmittedCount: number;
  lateTotalCount: number;
  onTimeSubmittedCount: number;
  onTimeTotalCount: number;
  outcome: GameOutcome;
  // 지각자 1인당 지각비 (승리 0원, 패배 기본 x 2, 무승부와 대기 중은 기본)
  penaltyPerPerson: number;
  lateMembers: GameLateMember[];
  scores: GameScore[];
}
