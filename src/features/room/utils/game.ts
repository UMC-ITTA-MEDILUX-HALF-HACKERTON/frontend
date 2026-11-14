import type {
  GameBoard,
  GameOutcome,
  GameTeam,
  Member,
  Room,
} from "@features/room/types/room.types";

// 지각비 게임 규칙. 방장이 시작하면 지각자 팀과 도착자 팀이 정해지고, 각자 점수를 한 번 낸다.
//   지각자 팀 평균 > 도착자 팀 평균 : 승리, 지각비 0원
//   지각자 팀 평균 < 도착자 팀 평균 : 패배, 기본 지각비 x 2
//   같으면 무승부, 기본 지각비 / 한 팀이라도 낸 사람이 없으면 대기(PENDING), 기본 지각비
// 실제 계산은 서버가 하고, 이 파일의 judge 와 buildGameBoard 는 mock 에서만 쓴다.

// 게임 화면의 점수 표기: 다섯 자리로 채운다 (예: 250 -> "00250").
export function padScore(score: number): string {
  return String(Math.max(0, Math.floor(score))).padStart(5, "0");
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function judge(
  lateAverage: number | null,
  onTimeAverage: number | null,
  baseFee: number,
): { outcome: GameOutcome; fee: number } {
  if (lateAverage === null || onTimeAverage === null) return { outcome: "PENDING", fee: baseFee };
  if (lateAverage > onTimeAverage) return { outcome: "WIN", fee: 0 };
  if (lateAverage < onTimeAverage) return { outcome: "LOSE", fee: baseFee * 2 };
  return { outcome: "DRAW", fee: baseFee };
}

// 게임을 시작하는 순간의 팀 나누기: 도착한 사람은 도착자 팀, 아직 도착하지 않은 사람은 지각자 팀.
export function splitTeams(room: Room): { lateIds: string[]; onTimeIds: string[] } {
  return {
    lateIds: room.members.filter((m) => m.status !== "ARRIVED").map((m) => m.id),
    onTimeIds: room.members.filter((m) => m.status === "ARRIVED").map((m) => m.id),
  };
}

// mock 이 저장하는 한 판의 상태
export interface MockGame {
  lateIds: string[];
  onTimeIds: string[];
  // memberId -> 점수
  scores: Record<string, number>;
  finished: boolean;
}

export function buildGameBoard(room: Room, game: MockGame | null): GameBoard {
  if (!game) {
    return {
      status: "NOT_STARTED",
      lateAverage: null,
      onTimeAverage: null,
      lateSubmittedCount: 0,
      lateTotalCount: 0,
      onTimeSubmittedCount: 0,
      onTimeTotalCount: 0,
      outcome: "PENDING",
      penaltyPerPerson: room.baseFee,
      lateMembers: [],
      scores: [],
    };
  }
  const teamOf = (id: string): GameTeam => (game.lateIds.includes(id) ? "LATE" : "ON_TIME");
  const scores = Object.entries(game.scores).map(([memberId, score]) => ({
    memberId,
    nickname: room.members.find((m) => m.id === memberId)?.nickname ?? "",
    team: teamOf(memberId),
    score,
  }));
  const lateScores = scores.filter((s) => s.team === "LATE").map((s) => s.score);
  const onTimeScores = scores.filter((s) => s.team === "ON_TIME").map((s) => s.score);
  const lateAverage = average(lateScores);
  const onTimeAverage = average(onTimeScores);
  const { outcome, fee } = judge(lateAverage, onTimeAverage, room.baseFee);
  return {
    status: game.finished ? "FINISHED" : "PLAYING",
    lateAverage,
    onTimeAverage,
    lateSubmittedCount: lateScores.length,
    lateTotalCount: game.lateIds.length,
    onTimeSubmittedCount: onTimeScores.length,
    onTimeTotalCount: game.onTimeIds.length,
    outcome,
    penaltyPerPerson: fee,
    lateMembers: game.lateIds.map((id) => ({
      memberId: id,
      nickname: room.members.find((m) => m.id === id)?.nickname ?? "",
      lateMinutes: null,
      score: game.scores[id] ?? null,
      penalty: fee,
    })),
    scores,
  };
}

// 지금 "나"가 게임에서 할 수 있는 것.
//   START       방장이 게임을 시작할 수 있다 (시작 전, 지각자가 있을 때)
//   WAIT_START  방장이 시작하기를 기다린다
//   PLAY        점수를 낼 차례다 (진행 중이고 아직 내지 않았다)
//   DONE        이미 점수를 냈거나 게임이 끝났다
//   NO_GAME     지각자가 없어서 게임이 없다
//   NOT_MEMBER  이 모임의 참가자가 아니다
export type GameTurn = "START" | "WAIT_START" | "PLAY" | "DONE" | "NO_GAME" | "NOT_MEMBER";

export function gameTurn(room: Room, board: GameBoard, meId: string | null): GameTurn {
  const me = room.members.find((m) => m.id === meId);
  if (!me) return "NOT_MEMBER";
  if (board.status === "NOT_STARTED") {
    if (room.members.every((m) => m.status === "ARRIVED")) return "NO_GAME";
    return me.isHost ? "START" : "WAIT_START";
  }
  if (board.status === "FINISHED") return "DONE";
  return board.scores.some((s) => s.memberId === me.id) ? "DONE" : "PLAY";
}

// 내가 지각자 팀인지. 시작 전에는 도착 여부로, 시작 후에는 서버가 정한 지각자 목록으로 판단한다.
export function isLateTeam(me: Member, board: GameBoard): boolean {
  if (board.status === "NOT_STARTED") return me.status !== "ARRIVED";
  return board.lateMembers.some((m) => m.memberId === me.id);
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
