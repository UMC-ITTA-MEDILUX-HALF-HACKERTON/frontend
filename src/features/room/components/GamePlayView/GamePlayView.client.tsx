"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MemberAvatar } from "@features/room/components/MemberAvatar/MemberAvatar";
import { PageHeader } from "@common/components/PageHeader/PageHeader";
import { RunnerGame } from "@features/game/components/RunnerGame/RunnerGame.client";
import { MockMeSwitcher } from "@features/room/components/MockMeSwitcher/MockMeSwitcher.client";
import { useMyMemberId } from "@features/room/hooks/useMyMemberId";
import { useSubmitGameScore } from "@features/room/mutations/useSubmitGameScore";
import { useGameResult } from "@features/room/queries/useGameResult";
import { useRoom } from "@features/room/queries/useRoom";
import { gameTurn } from "@features/room/utils/game";
import { ApiError } from "@lib/api/error";

// S-003b 플레이 중. 화면을 탭해 점프하고, 끝나면 점수를 내고 결과 화면으로 간다.
export function GamePlayView({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { data: room } = useRoom(roomId);
  const { data: board } = useGameResult(roomId);
  const meId = useMyMemberId(roomId);
  const submit = useSubmitGameScore();
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const introPath = `/rooms/${encodeURIComponent(roomId)}/game`;
  const turn = room && board ? gameTurn(room, board, meId) : null;

  // 내 차례가 아니면(이미 했거나, 지각자인데 도착자가 아직 안 끝났거나) 규칙 화면으로 돌려보낸다.
  // 점수를 낸 직후에는 결과 화면으로 가는 중이라 돌려보내지 않는다.
  useEffect(() => {
    if (turn !== null && turn !== "PLAY" && !finished) router.replace(introPath);
  }, [turn, finished, router, introPath]);

  if (!room || !board || turn !== "PLAY") {
    return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;
  }

  const me = room.members.find((m) => m.id === meId);
  const isLate = me?.id === board.lateMemberId;
  const target = board.arrivedAverage !== null ? Math.round(board.arrivedAverage) : null;
  const error =
    submit.error instanceof ApiError
      ? submit.error.message
      : submit.error
        ? "점수를 저장하지 못했어요. 잠시 후 다시 시도해 주세요."
        : null;

  function handleGameOver(finalScore: number) {
    setScore(finalScore);
    setFinished(true);
    submit.mutate(
      { roomId, input: { score: finalScore } },
      { onSuccess: () => router.replace(`${introPath}/result`) },
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <MockMeSwitcher roomId={roomId} />
      <PageHeader
        title={`${me?.nickname ?? ""} 플레이 중`}
        back="close"
        onBack={() => router.push(introPath)}
      />
      <div className="flex flex-1 flex-col gap-3 px-5">
        <div className="flex items-end justify-between">
          <span className="text-sub text-xs">현재 점수</span>
          <span className="text-primary text-[34px] leading-none font-black tabular-nums">
            {score}
          </span>
        </div>
        {isLate && target !== null ? (
          <div className="bg-fill flex items-center justify-between rounded-xl px-4 py-2.5 text-xs">
            <span className="text-sub">이겨야 할 점수 (도착자 평균)</span>
            <span className="font-black tabular-nums">{target}</span>
          </div>
        ) : null}

        <RunnerGame onScoreChange={setScore} onGameOver={handleGameOver} />
        <p className="text-sub text-center text-xs">화면을 탭해서 점프 · 장애물을 피해 달려요</p>

        <ul className="mt-1 flex flex-col gap-2.5">
          {room.members.map((m, index) => {
            const entry = board.scores.find((s) => s.memberId === m.id);
            const mine = m.id === me?.id;
            return (
              <li key={m.id} className="flex items-center gap-3">
                <MemberAvatar nickname={m.nickname} index={index} size="sm" />
                <span className="flex-1 text-sm font-bold">{m.nickname}</span>
                {mine && finished ? (
                  <span className="text-sm font-black tabular-nums">{score}</span>
                ) : entry ? (
                  <span className="text-sm font-black tabular-nums">{entry.score}</span>
                ) : (
                  <span className="text-sub text-xs">대기 중</span>
                )}
              </li>
            );
          })}
        </ul>
        {error ? <p className="text-coral text-sm font-medium">{error}</p> : null}
      </div>
    </div>
  );
}
