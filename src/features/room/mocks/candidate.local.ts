import { ApiError } from "@lib/api/error";

import type {
  Candidate,
  CandidateBoard,
  CreateCandidateInput,
  DecisionInput,
  Room,
  VoteInput,
} from "@features/room/types/room.types";
import { getMyMemberId } from "@features/room/utils/me";

// 서버 모드에서 쓰는 정하기 탭 임시 저장소. 서버에는 아직 이 화면에 맞는 API 가 없다.
// (서버는 투표 주제 + 선택지 2개 이상 구조이고 방장만 만들 수 있다. 연동은 백엔드와 협의한 뒤 따로 한다.)
// 후보, 투표, 확정은 이 브라우저의 localStorage 에만 저장되어 다른 참가자에게 보이지 않는다.
// 참가자 목록은 서버 모임 정보(room)를 그대로 쓴다.

type StoredCandidate = Omit<Candidate, "voteCount">;

interface RoomState {
  candidates: StoredCandidate[];
  // memberId -> candidateId
  votes: Record<string, string>;
  confirmedCandidateId: string | null;
  seq: number;
}

const KEY = "local-candidates-v1";

function load(): Record<string, RoomState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Record<string, RoomState>;
  } catch {
    // 깨진 값이면 새로 시작한다.
  }
  return {};
}

function save(all: Record<string, RoomState>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // 저장하지 못하면 이번 방문에서만 유지된다.
  }
}

function stateOf(all: Record<string, RoomState>, roomId: string): RoomState {
  return (all[roomId] ??= { candidates: [], votes: {}, confirmedCandidateId: null, seq: 0 });
}

export const localCandidateApi = {
  createCandidate(roomId: string, input: CreateCandidateInput): void {
    const all = load();
    const state = stateOf(all, roomId);
    state.seq += 1;
    state.candidates.push({
      id: `c${state.seq}`,
      kind: input.kind,
      name: input.name,
      mapLink: input.mapLink ? input.mapLink : null,
    });
    save(all);
  },

  getBoard(room: Room): CandidateBoard {
    const state = stateOf(load(), room.id);
    const me = getMyMemberId(room.id);
    const voted = (memberId: string) => state.votes[memberId] !== undefined;
    return {
      candidates: state.candidates.map((c) => ({
        ...c,
        voteCount: Object.values(state.votes).filter((id) => id === c.id).length,
      })),
      memberCount: room.members.length,
      votedCount: room.members.filter((m) => voted(m.id)).length,
      nonVoterIds: room.members.filter((m) => !voted(m.id)).map((m) => m.id),
      myVoteCandidateId: me ? (state.votes[me] ?? null) : null,
      confirmedCandidateId: state.confirmedCandidateId,
    };
  },

  putVote(room: Room, input: VoteInput): void {
    const all = load();
    const state = stateOf(all, room.id);
    const me = getMyMemberId(room.id);
    if (!me || !room.members.some((m) => m.id === me)) {
      throw new ApiError("인증이 필요합니다.", 401, null, "UNAUTHORIZED");
    }
    if (state.confirmedCandidateId) {
      throw new ApiError("이미 확정되어 투표할 수 없어요.", 409, null, "DUPLICATE");
    }
    if (!state.candidates.some((c) => c.id === input.candidateId)) {
      throw new ApiError("후보를 찾을 수 없어요.", 404, null, "NOT_FOUND");
    }
    state.votes[me] = input.candidateId;
    save(all);
  },

  decide(room: Room, input: DecisionInput): void {
    const all = load();
    const state = stateOf(all, room.id);
    const me = room.members.find((m) => m.id === getMyMemberId(room.id));
    if (!me?.isHost) throw new ApiError("주최자만 확정할 수 있어요.", 403, null, "FORBIDDEN");
    if (!state.candidates.some((c) => c.id === input.candidateId)) {
      throw new ApiError("후보를 찾을 수 없어요.", 404, null, "NOT_FOUND");
    }
    state.confirmedCandidateId = input.candidateId;
    save(all);
  },
};
