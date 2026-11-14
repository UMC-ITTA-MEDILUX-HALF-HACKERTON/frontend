import type { GameBoard, GameOutcome, GameScore, Room } from "@features/room/types/room.types";

// 지각비 게임 규칙. 지각자 1명이 도착자 전원의 평균 점수와 겨룬다.
//   지각자 점수 > 도착자 평균 : 승리, 지각비 0원
//   지각자 점수 < 도착자 평균 : 패배, 기본 지각비 x 2
//   지각자 점수 = 도착자 평균 : 무승부, 기본 지각비
// 실제 계산은 백엔드가 하고, 이 함수는 mock 과 화면 확인에 쓴다.

// 게임 화면의 점수 표기: 다섯 자리로 채운다 (예: 250 -> "00250").
export function padScore(score: number): string {
  return String(Math.max(0, Math.floor(score))).padStart(5, "0");
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function judge(
  lateScore: number,
  arrivedAverage: number,
  baseFee: number,
): { outcome: GameOutcome; fee: number } {
  if (lateScore > arrivedAverage) return { outcome: "WIN", fee: 0 };
  if (lateScore < arrivedAverage) return { outcome: "LOSE", fee: baseFee * 2 };
  return { outcome: "DRAW", fee: baseFee };
}

// 지각자는 도착하지 않은 참가자 중 첫 번째 사람이다. 없으면 null (모두 도착했으면 게임이 없다).
export function pickLateMemberId(room: Room): string | null {
  return room.members.find((m) => m.status !== "ARRIVED")?.id ?? null;
}

export function buildGameBoard(room: Room, scores: GameScore[]): GameBoard {
  const lateMemberId = pickLateMemberId(room);
  const arrivedIds = room.members.filter((m) => m.status === "ARRIVED").map((m) => m.id);
  const arrivedScores = scores.filter((s) => arrivedIds.includes(s.memberId)).map((s) => s.score);
  const arrivedAverage = average(arrivedScores);
  const lateScore = scores.find((s) => s.memberId === lateMemberId)?.score ?? null;

  const result =
    lateScore !== null && arrivedAverage !== null
      ? judge(lateScore, arrivedAverage, room.baseFee)
      : null;

  return {
    lateMemberId,
    scores,
    arrivedCount: arrivedIds.length,
    arrivedScores,
    arrivedAverage,
    lateScore,
    outcome: result?.outcome ?? null,
    fee: result?.fee ?? null,
    baseFee: room.baseFee,
  };
}

// 지금 "나"가 게임에서 할 수 있는 것.
//   PLAY          내 차례 (도착자는 언제든, 지각자는 도착자가 모두 끝난 뒤)
//   DONE          이미 점수를 냈다
//   WAIT_ARRIVED  지각자인데 비교할 도착자가 없거나, 아직 점수를 내지 않은 도착자가 있다
//   SPECTATOR     지각자도 도착자도 아니다 (도착하지 않았지만 이번 지각자로 뽑히지 않았다)
//   NO_GAME       모두 도착해서 게임이 없다
//   NOT_MEMBER    이 모임의 참가자가 아니다
export type GameTurn = "PLAY" | "DONE" | "WAIT_ARRIVED" | "SPECTATOR" | "NO_GAME" | "NOT_MEMBER";

export function gameTurn(room: Room, board: GameBoard, meId: string | null): GameTurn {
  const me = room.members.find((m) => m.id === meId);
  if (!me) return "NOT_MEMBER";
  if (board.lateMemberId === null) return "NO_GAME";
  if (board.scores.some((s) => s.memberId === me.id)) return "DONE";
  if (me.id === board.lateMemberId) {
    // 도착자가 한 명도 없으면 비교할 평균이 없어 결과가 정해지지 않으므로 시작하지 못하게 한다.
    const comparable = board.arrivedCount > 0 && board.arrivedScores.length >= board.arrivedCount;
    return comparable ? "PLAY" : "WAIT_ARRIVED";
  }
  return me.status === "ARRIVED" ? "PLAY" : "SPECTATOR";
}

// 닉네임 뒤에 붙는 주격 조사 (받침이 있으면 "이", 없으면 "가"). 한글이 아니면 "가".
export function subject(nickname: string): string {
  const last = Array.from(nickname).pop();
  if (!last) return nickname;
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinal = isHangul && (code - 0xac00) % 28 !== 0;
  return `${nickname}${hasFinal ? "이" : "가"}`;
}
