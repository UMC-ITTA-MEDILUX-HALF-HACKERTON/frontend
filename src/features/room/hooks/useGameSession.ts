"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useMyMemberId } from "@features/room/hooks/useMyMemberId";
import { useSubmitGameScore } from "@features/room/mutations/useSubmitGameScore";
import { useGameResult } from "@features/room/queries/useGameResult";
import { useRoom } from "@features/room/queries/useRoom";
import type { GameBoard, Member, Room } from "@features/room/types/room.types";
import { gameTurn, isLateTeam } from "@features/room/utils/game";
import { ApiError } from "@lib/api/error";

export interface ScoreRow {
  memberId: string;
  nickname: string;
  // 참가자 순서 (아바타 색을 정한다)
  index: number;
  // 점수를 냈으면 점수, 아직이면 null
  score: number | null;
  mine: boolean;
}

export interface GameSession {
  roomId: string;
  room: Room;
  board: GameBoard;
  me: Member;
  isLate: boolean;
  // 지각자 팀이 이겨야 할 점수(도착자 팀 평균, 반올림). 아직 점수를 낸 도착자가 없거나 도착자 팀이면 null.
  target: number | null;
  rows: ScoreRow[];
  // 지금까지 점수를 낸 사람 수, 전체 인원
  completedCount: number;
  totalCount: number;
  // 방에서 가장 높은 점수(HI)
  bestScore: number;
  liveScore: number;
  setLiveScore: (score: number) => void;
  // 내 판이 끝나 점수를 보냈는지
  finished: boolean;
  // 참가자 전원이 점수를 내 게임이 끝났는지. true 이면 곧 결과 화면으로 넘어간다.
  resultReady: boolean;
  error: string | null;
  finishGame: (score: number) => void;
  // 규칙 화면으로 나간다
  leave: () => void;
}

const RESULT_DELAY_MS = 1600;

// 지각비 게임 한 판의 데이터와 흐름: 내 차례인지 확인하고, 끝나면 점수를 내고, 결과가 나오면 결과 화면으로 간다.
// 내 차례가 아니면(아직 시작 전이거나 이미 했거나) null 을 돌려주고 규칙 화면으로 돌려보낸다.
export function useGameSession(roomId: string): GameSession | null {
  const router = useRouter();
  const { data: room } = useRoom(roomId);
  const { data: board } = useGameResult(roomId);
  const meId = useMyMemberId(roomId);
  const submit = useSubmitGameScore();
  const [liveScore, setLiveScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const introPath = `/rooms/${encodeURIComponent(roomId)}/game`;
  const resultPath = `${introPath}/result`;
  const turn = room && board ? gameTurn(room, board, meId) : null;

  useEffect(() => {
    if (turn !== null && turn !== "PLAY" && !finished) router.replace(introPath);
  }, [turn, finished, router, introPath]);

  // 참가자 전원이 점수를 내면 게임이 끝난다. 게임 오버 화면을 잠깐 보여 준 뒤 결과 화면으로 간다.
  const gameFinished = board?.status === "FINISHED";
  useEffect(() => {
    if (!finished || !submit.isSuccess || !gameFinished) return;
    const id = setTimeout(() => router.replace(resultPath), RESULT_DELAY_MS);
    return () => clearTimeout(id);
  }, [finished, submit.isSuccess, gameFinished, router, resultPath]);

  const me = room?.members.find((m) => m.id === meId);
  if (!room || !board || !me || (turn !== "PLAY" && !finished)) return null;

  const rows: ScoreRow[] = room.members.map((m, index) => {
    const entry = board.scores.find((s) => s.memberId === m.id);
    const mine = m.id === me.id;
    return {
      memberId: m.id,
      nickname: m.nickname,
      index,
      score: mine && (finished || liveScore > 0) ? liveScore : (entry?.score ?? null),
      mine,
    };
  });

  const isLate = isLateTeam(me, board);
  const error =
    submit.error instanceof ApiError
      ? submit.error.message
      : submit.error
        ? "점수를 저장하지 못했어요. 잠시 후 다시 시도해 주세요."
        : null;

  return {
    roomId,
    room,
    board,
    me,
    isLate,
    target: isLate && board.onTimeAverage !== null ? Math.round(board.onTimeAverage) : null,
    rows,
    // 내 점수가 서버에 반영되기 전에도 "내 판이 끝났다"는 것을 바로 보여 준다.
    completedCount:
      board.scores.length + (finished && !board.scores.some((s) => s.memberId === me.id) ? 1 : 0),
    totalCount: board.lateTotalCount + board.onTimeTotalCount || room.members.length,
    bestScore: Math.max(0, liveScore, ...board.scores.map((s) => s.score)),
    liveScore,
    setLiveScore,
    finished,
    resultReady: gameFinished,
    error,
    finishGame: (score: number) => {
      setLiveScore(score);
      setFinished(true);
      submit.mutate({ roomId, input: { score } });
    },
    leave: () => router.push(introPath),
  };
}
