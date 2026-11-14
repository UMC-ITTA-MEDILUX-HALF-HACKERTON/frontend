import { ApiError } from "@lib/api/error";

import type {
  Candidate,
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
  Member,
  Room,
  VoteInput,
} from "@features/room/types/room.types";
import { buildGameBoard } from "@features/room/utils/game";
import { combineDateTime } from "@features/room/utils/time";
import { getMyMemberId, setMyMemberId } from "@features/room/utils/me";

// 백엔드가 없을 때 쓰는 가짜 데이터. 브라우저 localStorage 에 저장해서 새로고침해도 남는다.
// NEXT_PUBLIC_USE_MOCK=true 일 때만 room.api.ts 가 이 파일을 쓴다.
// 처음 열면 디자인(Figma)과 같은 데모 모임 "demo"(초대 코드 x8F2k)가 들어 있다.

type StoredCandidate = Omit<Candidate, "voteCount">;

interface Db {
  rooms: Room[];
  candidates: Record<string, StoredCandidate[]>;
  // roomId -> memberId -> candidateId
  votes: Record<string, Record<string, string>>;
  // roomId -> memberId -> 게임 점수
  scores: Record<string, Record<string, number>>;
  seq: number;
}

// 데이터 모양이 바뀌면 버전을 올려서 예전에 저장된 데모 데이터를 버린다.
const DB_KEY = "mock-room-db-v3";
// 약속 12분 34초 전(현황 탭 "약속 전")과 약속 6분 12초 후(현황 탭 "약속 시간 지남") 데모 모임
export const DEMO_ROOM_ID = "demo";
export const DEMO_LATE_ROOM_ID = "demo-late";

const MINUTE = 60_000;

// 참가자 순서가 아바타 색을 정한다 (민지 보라, 지수 초록, 철수 주황, 영희 분홍: 디자인과 같다).
function demoMembers(arrived: boolean, appointmentMs: number): Member[] {
  const at = (minutesFromAppointment: number) =>
    new Date(appointmentMs + minutesFromAppointment * MINUTE).toISOString();
  return [
    {
      id: "m1",
      nickname: "민지",
      isHost: true,
      status: arrived ? "ARRIVED" : "NEARBY",
      distanceM: 40,
      arrivedAt: arrived ? at(-8) : null,
    },
    {
      id: "m2",
      nickname: "지수",
      isHost: false,
      status: arrived ? "ARRIVED" : "NEARBY",
      distanceM: 60,
      arrivedAt: arrived ? at(-2) : null,
    },
    {
      id: "m3",
      nickname: "철수",
      isHost: false,
      status: "MOVING",
      distanceM: arrived ? 400 : 1200,
      arrivedAt: null,
    },
    {
      id: "m4",
      nickname: "영희",
      isHost: false,
      status: arrived ? "ARRIVED" : "GPS_OFF",
      distanceM: arrived ? 30 : null,
      arrivedAt: arrived ? at(0) : null,
    },
  ];
}

function seed(): Db {
  const now = Date.now();
  const beforeMs = now + (12 * 60 + 34) * 1000;
  const afterMs = now - (6 * 60 + 12) * 1000;
  const baseCandidates: StoredCandidate[] = [
    { id: "c1", kind: "ACTIVITY", name: "코인노래방", mapLink: null },
    { id: "c2", kind: "PLACE", name: "2차 포차", mapLink: null },
    { id: "c3", kind: "PLACE", name: "근처 카페", mapLink: null },
  ];
  const room = (id: string, code: string, appointmentMs: number, arrived: boolean): Room => ({
    id,
    code,
    name: "금요일 동아리 회식",
    place: "강남역 ○○포차",
    appointmentAt: new Date(appointmentMs).toISOString(),
    lateGameEnabled: true,
    baseFee: 3000,
    members: demoMembers(arrived, appointmentMs),
    confirmedCandidateId: null,
  });
  return {
    rooms: [
      room(DEMO_ROOM_ID, "x8F2k", beforeMs, false),
      room(DEMO_LATE_ROOM_ID, "k7Lm2", afterMs, true),
    ],
    candidates: {
      [DEMO_ROOM_ID]: baseCandidates.map((c) => ({ ...c })),
      [DEMO_LATE_ROOM_ID]: baseCandidates.map((c) => ({ ...c })),
    },
    votes: {
      [DEMO_ROOM_ID]: { m1: "c1", m2: "c1", m3: "c2" },
      [DEMO_LATE_ROOM_ID]: { m1: "c1", m2: "c1", m3: "c2" },
    },
    // 약속 후 모임: 도착한 3명은 이미 게임을 했고(평균 200), 지각자 철수가 도전할 차례다.
    scores: { [DEMO_LATE_ROOM_ID]: { m1: 250, m2: 150, m4: 200 } },
    seq: 10,
  };
}

function load(): Db {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    // 깨진 값이면 새로 시작한다.
  }
  const fresh = seed();
  save(fresh);
  // 데모 모임에서는 내가 주최자(민지)다.
  setMyMemberId(DEMO_ROOM_ID, "m1");
  setMyMemberId(DEMO_LATE_ROOM_ID, "m1");
  return fresh;
}

function save(db: Db): void {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // 저장하지 못하면 이번 방문에서만 유지된다.
  }
}

function notFound(): ApiError {
  return new ApiError("모임을 찾을 수 없습니다.", 404, null, "NOT_FOUND");
}

function findRoom(db: Db, roomId: string): Room {
  const room = db.rooms.find((r) => r.id === roomId);
  if (!room) throw notFound();
  return room;
}

function randomCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function withDelay<T>(value: () => T): Promise<T> {
  // 실제 통신처럼 잠깐 걸리게 한다. 오류는 거절(reject)로 돌려준다.
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(value());
      } catch (error) {
        reject(error);
      }
    }, 120);
  });
}

export const mockRoomApi = {
  createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
    return withDelay(() => {
      const db = load();
      const appointmentAt = combineDateTime(input.date, input.time);
      if (!appointmentAt)
        throw new ApiError("날짜와 시간을 확인해 주세요.", 400, null, "INVALID_INPUT");
      db.seq += 1;
      const id = `r${db.seq}`;
      const memberId = `m${db.seq}`;
      let code = randomCode();
      while (db.rooms.some((r) => r.code === code)) code = randomCode();
      db.rooms.push({
        id,
        code,
        name: input.name,
        place: input.place,
        appointmentAt,
        lateGameEnabled: input.lateGameEnabled,
        baseFee: input.baseFee,
        // TODO(백엔드 DTO 확정 후): 주최자 닉네임을 받는지 확인한다. 디자인에는 입력칸이 없다.
        members: [
          {
            id: memberId,
            nickname: "주최자",
            isHost: true,
            status: "NEARBY",
            distanceM: null,
            arrivedAt: null,
          },
        ],
        confirmedCandidateId: null,
      });
      db.candidates[id] = [];
      db.votes[id] = {};
      save(db);
      setMyMemberId(id, memberId);
      return { roomId: id, code, memberId };
    });
  },

  getRoomByCode(code: string): Promise<Room> {
    return withDelay(() => {
      const room = load().rooms.find((r) => r.code === code);
      if (!room) throw notFound();
      return room;
    });
  },

  joinRoom(input: JoinRoomInput): Promise<JoinRoomResult> {
    return withDelay(() => {
      const db = load();
      const room = db.rooms.find((r) => r.code === input.code);
      if (!room) throw notFound();
      if (room.members.some((m) => m.nickname === input.nickname)) {
        throw new ApiError("이미 같은 닉네임이 있어요.", 409, null, "DUPLICATE");
      }
      db.seq += 1;
      const memberId = `m${db.seq}`;
      room.members.push({
        id: memberId,
        nickname: input.nickname,
        isHost: false,
        status: "MOVING",
        distanceM: 1500,
        arrivedAt: null,
      });
      save(db);
      setMyMemberId(room.id, memberId);
      return { roomId: room.id, memberId };
    });
  },

  getRoom(roomId: string): Promise<Room> {
    return withDelay(() => findRoom(load(), roomId));
  },

  confirmArrival(roomId: string, memberId: string, input: ConfirmArrivalInput): Promise<Room> {
    return withDelay(() => {
      const db = load();
      const room = findRoom(db, roomId);
      const member = room.members.find((m) => m.id === memberId);
      if (!member) throw notFound();
      if (input.arrived) {
        member.status = "ARRIVED";
        member.arrivedAt = input.arrivedAt ?? new Date().toISOString();
      } else {
        member.status = member.distanceM !== null && member.distanceM <= 100 ? "NEARBY" : "MOVING";
        member.arrivedAt = null;
      }
      save(db);
      return room;
    });
  },

  createCandidate(roomId: string, input: CreateCandidateInput): Promise<Candidate> {
    return withDelay(() => {
      const db = load();
      findRoom(db, roomId);
      db.seq += 1;
      const stored: StoredCandidate = {
        id: `c${db.seq}`,
        kind: input.kind,
        name: input.name,
        mapLink: input.mapLink ? input.mapLink : null,
      };
      (db.candidates[roomId] ??= []).push(stored);
      save(db);
      return { ...stored, voteCount: 0 };
    });
  },

  getCandidates(roomId: string): Promise<CandidateBoard> {
    return withDelay(() => {
      const db = load();
      const room = findRoom(db, roomId);
      const votes = db.votes[roomId] ?? {};
      const me = getMyMemberId(roomId);
      const candidates = (db.candidates[roomId] ?? []).map((c) => ({
        ...c,
        voteCount: Object.values(votes).filter((id) => id === c.id).length,
      }));
      return {
        candidates,
        memberCount: room.members.length,
        votedCount: room.members.filter((m) => votes[m.id]).length,
        nonVoterIds: room.members.filter((m) => !votes[m.id]).map((m) => m.id),
        myVoteCandidateId: me ? (votes[me] ?? null) : null,
        confirmedCandidateId: room.confirmedCandidateId,
      };
    });
  },

  putVote(roomId: string, input: VoteInput): Promise<void> {
    return withDelay(() => {
      const db = load();
      const room = findRoom(db, roomId);
      const me = getMyMemberId(roomId);
      if (!me || !room.members.some((m) => m.id === me)) {
        throw new ApiError("인증이 필요합니다.", 401, null, "UNAUTHORIZED");
      }
      if (room.confirmedCandidateId) {
        throw new ApiError("이미 확정되어 투표할 수 없어요.", 409, null, "DUPLICATE");
      }
      if (!(db.candidates[roomId] ?? []).some((c) => c.id === input.candidateId)) throw notFound();
      (db.votes[roomId] ??= {})[me] = input.candidateId;
      save(db);
    });
  },

  decideCandidate(roomId: string, input: DecisionInput): Promise<Room> {
    return withDelay(() => {
      const db = load();
      const room = findRoom(db, roomId);
      const me = getMyMemberId(roomId);
      const meMember = room.members.find((m) => m.id === me);
      if (!meMember?.isHost) {
        throw new ApiError("주최자만 확정할 수 있어요.", 403, null, "FORBIDDEN");
      }
      if (!(db.candidates[roomId] ?? []).some((c) => c.id === input.candidateId)) throw notFound();
      room.confirmedCandidateId = input.candidateId;
      save(db);
      return room;
    });
  },

  getGameBoard(roomId: string): Promise<GameBoard> {
    return withDelay(() => {
      const db = load();
      const room = findRoom(db, roomId);
      const scores = Object.entries(db.scores?.[roomId] ?? {}).map(([memberId, score]) => ({
        memberId,
        score,
      }));
      return buildGameBoard(room, scores);
    });
  },

  submitGameScore(roomId: string, input: GameScoreInput): Promise<void> {
    return withDelay(() => {
      const db = load();
      const room = findRoom(db, roomId);
      const me = getMyMemberId(roomId);
      if (!me || !room.members.some((m) => m.id === me)) {
        throw new ApiError("인증이 필요합니다.", 401, null, "UNAUTHORIZED");
      }
      if (!Number.isInteger(input.score) || input.score < 0) {
        throw new ApiError("점수가 올바르지 않아요.", 400, null, "INVALID_INPUT");
      }
      const scores = ((db.scores ??= {})[roomId] ??= {});
      if (scores[me] !== undefined) {
        throw new ApiError("이미 점수를 냈어요.", 409, null, "DUPLICATE");
      }
      scores[me] = input.score;
      save(db);
    });
  },

  // 아직 투표하지 않은 사람에게 알림을 보내는 "콕 찌르기". 백엔드 API 에는 없어서 mock 에서는 아무 일도 하지 않는다.
  nudge(): Promise<void> {
    return withDelay(() => undefined);
  },
};
