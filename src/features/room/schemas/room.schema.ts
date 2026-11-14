import { z } from "zod";

// 백엔드 응답을 화면 모델로 검증한다. 실제 DTO 가 정해지면 필드 이름을 여기서 맞춘다.
// TODO(백엔드 DTO 확정 후): 아래 필드는 화면이 필요로 하는 모양이다. 응답과 다르면 api 에서 변환한다.
export const memberSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  isHost: z.boolean(),
  status: z.enum(["NEARBY", "MOVING", "GPS_OFF", "ARRIVED"]),
  distanceM: z.number().nullable(),
  arrivedAt: z.string().nullable(),
});

export const roomSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  place: z.string(),
  appointmentAt: z.string(),
  lateGameEnabled: z.boolean(),
  baseFee: z.number(),
  members: z.array(memberSchema),
  confirmedCandidateId: z.string().nullable(),
});

export const candidateSchema = z.object({
  id: z.string(),
  kind: z.enum(["PLACE", "ACTIVITY"]),
  name: z.string(),
  mapLink: z.string().nullable(),
  voteCount: z.number(),
});

export const candidateBoardSchema = z.object({
  candidates: z.array(candidateSchema),
  memberCount: z.number(),
  votedCount: z.number(),
  nonVoterIds: z.array(z.string()),
  myVoteCandidateId: z.string().nullable(),
  confirmedCandidateId: z.string().nullable(),
});

export const gameBoardSchema = z.object({
  lateMemberId: z.string().nullable(),
  scores: z.array(z.object({ memberId: z.string(), score: z.number() })),
  arrivedCount: z.number(),
  arrivedScores: z.array(z.number()),
  arrivedAverage: z.number().nullable(),
  lateScore: z.number().nullable(),
  outcome: z.enum(["WIN", "LOSE", "DRAW"]).nullable(),
  fee: z.number().nullable(),
  baseFee: z.number(),
});

export const createRoomResultSchema = z.object({
  roomId: z.string(),
  code: z.string(),
  memberId: z.string(),
});

export const joinRoomResultSchema = z.object({
  roomId: z.string(),
  memberId: z.string(),
});

// 입력 검증 (폼)
export const createRoomInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "모임 이름을 입력해 주세요.")
    .max(30, "30자 이하로 입력해 주세요."),
  place: z
    .string()
    .trim()
    .min(1, "약속 장소를 입력해 주세요.")
    .max(50, "50자 이하로 입력해 주세요."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 선택해 주세요."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "시간을 선택해 주세요."),
  lateGameEnabled: z.boolean(),
  baseFee: z.number().int().min(0, "0원 이상으로 입력해 주세요.").max(1_000_000),
});

export const nicknameSchema = z
  .string()
  .trim()
  .min(1, "닉네임을 입력해 주세요.")
  .max(10, "10자 이하로 입력해 주세요.");

export const candidateInputSchema = z.object({
  kind: z.enum(["PLACE", "ACTIVITY"]),
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(30, "30자 이하로 입력해 주세요."),
  mapLink: z.string().trim().max(300).optional(),
  expectedMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60)
    .optional(),
});
