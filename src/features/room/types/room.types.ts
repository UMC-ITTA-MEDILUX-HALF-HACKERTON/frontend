// 화면이 쓰는 모임 도메인 모델. 백엔드 DTO 가 확정되면 api 계층에서 이 모양으로 바꿔 준다.
// TODO(백엔드 DTO 확정 후): 실제 응답 필드에 맞춰 schemas/room.schema.ts 를 고친다.

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
}

export interface Room {
  id: string;
  code: string;
  name: string;
  place: string;
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
}

// 응답: 모임 id, 초대 코드, 주최자로 등록된 memberId
export interface CreateRoomResult {
  roomId: string;
  code: string;
  memberId: string;
}

export interface JoinRoomInput {
  code: string;
  nickname: string;
}

export interface JoinRoomResult {
  roomId: string;
  memberId: string;
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

// 위치 갱신은 화면이 아직 쓰지 않는다. 필드는 DTO 확정 후 정한다.
export type UpdateLocationInput = Dto;

// 지각비 게임 (T-Rex). 지각자 1명이 도착자 전원의 평균 점수와 겨룬다.
export type GameOutcome = "WIN" | "LOSE" | "DRAW";

export interface GameScore {
  memberId: string;
  score: number;
}

export interface GameScoreInput {
  score: number;
}

export interface GameBoard {
  // 지각자(도착하지 않은 참가자). 모두 도착했으면 null.
  lateMemberId: string | null;
  scores: GameScore[];
  arrivedCount: number;
  // 점수를 낸 도착자들의 점수와 평균. 아직 없으면 평균은 null.
  arrivedScores: number[];
  arrivedAverage: number | null;
  lateScore: number | null;
  // 지각자가 점수를 냈을 때만 정해진다.
  outcome: GameOutcome | null;
  // 지각비. 승리 0원, 패배 기본 지각비 x 2, 무승부 기본 지각비.
  fee: number | null;
  baseFee: number;
}
