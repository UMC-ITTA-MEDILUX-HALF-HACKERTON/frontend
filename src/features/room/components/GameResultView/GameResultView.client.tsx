"use client";

import Link from "next/link";
import { useState } from "react";

import { MemberAvatar } from "@features/room/components/MemberAvatar/MemberAvatar";
import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { PageHeader } from "@common/components/PageHeader/PageHeader";
import { MockMeSwitcher } from "@features/room/components/MockMeSwitcher/MockMeSwitcher.client";
import { useGameResult } from "@features/room/queries/useGameResult";
import { useRoom } from "@features/room/queries/useRoom";
import { formatWon } from "@features/room/utils/time";
import type { GameOutcome } from "@features/room/types/room.types";

const OUTCOME_VIEW: Record<
  GameOutcome,
  { icon: string; iconBg: string; compare: string; note: (late: string) => string }
> = {
  WIN: {
    icon: "🎉",
    iconBg: "bg-mint-soft",
    compare: ">",
    note: () => "늦었지만 실력으로 만회했어요 🏃",
  },
  LOSE: { icon: "😅", iconBg: "bg-coral/10", compare: "<", note: () => "" },
  DRAW: { icon: "🤝", iconBg: "bg-fill", compare: "=", note: () => "기본 지각비만 내면 돼요" },
};

// S-004 게임 결과. 지각자 점수와 도착자 평균을 비교해 승리, 패배, 무승부를 보여 준다.
export function GameResultView({ roomId }: { roomId: string }) {
  const { data: room } = useRoom(roomId);
  const { data: board } = useGameResult(roomId);
  const [copied, setCopied] = useState(false);

  const roomPath = `/rooms/${encodeURIComponent(roomId)}`;

  if (!room || !board) return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;

  const late = room.members.find((m) => m.id === board.lateMemberId);
  if (
    !late ||
    board.outcome === null ||
    board.lateScore === null ||
    board.arrivedAverage === null
  ) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="게임 결과" onBack={() => history.back()} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-lg font-black">아직 결과가 없어요</p>
          <p className="text-sub text-sm">지각한 사람이 게임을 끝내면 결과가 나와요.</p>
          <Link href={`${roomPath}/game`} className="text-primary text-sm font-bold">
            게임 화면으로
          </Link>
        </div>
      </div>
    );
  }

  const view = OUTCOME_VIEW[board.outcome];
  const average = Math.round(board.arrivedAverage * 100) / 100;
  const ranking = [...board.scores].sort((a, b) => b.score - a.score);
  const title =
    board.outcome === "WIN"
      ? `${late.nickname} 역전승!`
      : board.outcome === "LOSE"
        ? `아쉽다, ${late.nickname}!`
        : "무승부!";
  const feeText = board.outcome === "WIN" ? "지각비 면제" : `지각비 ${formatWon(board.fee ?? 0)}`;
  const feeTone =
    board.outcome === "WIN"
      ? "bg-mint-soft text-mint-ink"
      : board.outcome === "LOSE"
        ? "bg-coral/10 text-coral"
        : "bg-fill text-ink";

  async function share() {
    const url = `${window.location.origin}${roomPath}/game/result`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `${late?.nickname} 지각비 게임 결과`, url });
      } catch {
        // 공유를 취소했으면 아무것도 하지 않는다.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드를 쓸 수 없으면 아무것도 하지 않는다.
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <MockMeSwitcher roomId={roomId} />
      <PageHeader title="게임 결과" back="none" />
      <div className="flex flex-1 flex-col gap-4 px-5">
        <div className="mt-2 text-center">
          <div
            className={`mx-auto flex size-[84px] items-center justify-center rounded-3xl text-5xl ${view.iconBg}`}
          >
            {view.icon}
          </div>
          <h2 className="mt-4 text-[26px] font-black">{title}</h2>
          <span
            className={`mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-black ${feeTone}`}
          >
            {feeText}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="bg-fill rounded-2xl py-3 text-center">
            <p className="text-sub text-[11px]">{late.nickname}</p>
            <p className="text-[28px] font-black tabular-nums">{board.lateScore}</p>
          </div>
          <span className="text-primary text-lg font-black">{view.compare}</span>
          <div className="bg-fill rounded-2xl py-3 text-center">
            <p className="text-sub text-[11px]">도착자 평균</p>
            <p className="text-[28px] font-black tabular-nums">{average}</p>
          </div>
        </div>
        <p className="text-sub text-center text-[11px]">
          {board.outcome === "DRAW"
            ? view.note(late.nickname)
            : `평균 = (${board.arrivedScores.join(" + ")}) ÷ ${board.arrivedScores.length}`}
          {board.outcome === "WIN" ? (
            <span className="block">{view.note(late.nickname)}</span>
          ) : null}
        </p>

        <ol className="flex flex-col gap-3">
          {ranking.map((entry, index) => {
            const member = room.members.find((m) => m.id === entry.memberId);
            if (!member) return null;
            return (
              <li key={entry.memberId} className="flex items-center gap-3">
                <span className="text-sub w-4 text-xs font-bold">{index + 1}</span>
                <MemberAvatar
                  nickname={member.nickname}
                  index={room.members.findIndex((m) => m.id === member.id)}
                  size="sm"
                />
                <span className="flex-1 text-sm font-bold">{member.nickname}</span>
                <span className="text-sm font-black tabular-nums">{entry.score}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex gap-2 px-5 pt-4 pb-6">
        <Button
          className={btn({ size: "lg", tone: "fill", className: "shrink-0" })}
          onClick={share}
        >
          {copied ? "복사됨" : "공유"}
        </Button>
        <Link
          href={roomPath}
          className="bg-primary flex h-[52px] flex-1 items-center justify-center rounded-2xl text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(91,76,245,0.35)]"
        >
          모임으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
