"use client";

import Link from "next/link";

import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { PageHeader } from "@common/components/PageHeader/PageHeader";
import { StatusChip } from "@common/components/StatusChip";
import { MockMeSwitcher } from "@features/room/components/MockMeSwitcher/MockMeSwitcher.client";
import { useMyMemberId } from "@features/room/hooks/useMyMemberId";
import { useGameResult } from "@features/room/queries/useGameResult";
import { useRoom } from "@features/room/queries/useRoom";
import { gameTurn, subject } from "@features/room/utils/game";
import { formatWon } from "@features/room/utils/time";

// S-003a 지각비 게임 규칙 확인. 지각자 1명이 도착자 전원의 평균 점수와 겨룬다.
export function GameIntroView({ roomId }: { roomId: string }) {
  const { data: room } = useRoom(roomId);
  const { data: board } = useGameResult(roomId);
  const meId = useMyMemberId(roomId);

  const roomPath = `/rooms/${encodeURIComponent(roomId)}`;

  if (!room || !board) return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;

  const late = room.members.find((m) => m.id === board.lateMemberId);
  const turn = gameTurn(room, board, meId);
  const doneCount = board.scores.length;

  if (!late) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="지각비 게임" onBack={() => history.back()} />
        <p className="text-sub p-8 text-center text-sm">
          모두 도착해서 지각비 게임은 필요 없어요 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <MockMeSwitcher roomId={roomId} />
      <PageHeader title="지각비 게임" onBack={() => history.back()} />
      <div className="flex flex-1 flex-col gap-3 px-5">
        <div className="mt-2 text-center">
          <div className="bg-primary-soft mx-auto flex size-[72px] items-center justify-center rounded-3xl text-4xl">
            🦖
          </div>
          <h2 className="mt-4 text-[22px] font-black">
            {late.nickname} vs 도착자 {board.arrivedCount}명
          </h2>
          <p className="text-sub mt-1 text-xs">한 판씩 달려서 점수를 비교해요</p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="bg-fill rounded-2xl py-3 text-center">
            <p className="text-sub text-[11px]">늦은 사람</p>
            <p className="text-lg font-black">{late.nickname}</p>
          </div>
          <span className="text-primary text-sm font-black">VS</span>
          <div className="bg-fill rounded-2xl py-3 text-center">
            <p className="text-sub text-[11px]">도착자 평균</p>
            <p className="text-lg font-black">{board.arrivedCount}명</p>
          </div>
        </div>

        <dl className="flex flex-col gap-2 text-sm">
          <Rule label={`🎉 ${subject(late.nickname)} 이기면`} value="면제" tone="text-mint" />
          <Rule label="🤝 비기면" value={formatWon(board.baseFee)} />
          <Rule label="😅 지면" value={formatWon(board.baseFee * 2)} tone="text-coral" />
        </dl>

        <section aria-label="참여 현황" className="mt-1">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-black">참여 현황</h3>
            <span className="text-sub text-xs">
              {doneCount}/{room.members.length} 완료
            </span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {room.members.map((m) => {
              const done = board.scores.some((s) => s.memberId === m.id);
              return (
                <li key={m.id}>
                  <StatusChip status={done ? "arrived" : "moving"} className="px-3 py-1.5 text-xs">
                    {m.nickname}
                    {done ? " ✓" : ""}
                  </StatusChip>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="flex flex-col gap-2 px-5 pt-4 pb-6">
        {turn === "PLAY" ? (
          <Link
            href={`${roomPath}/game/play`}
            className="bg-primary flex h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(91,76,245,0.35)]"
          >
            내 차례 시작하기
          </Link>
        ) : (
          <Button className={btn({ size: "lg", full: true })} disabled>
            {turn === "DONE"
              ? "이미 플레이했어요"
              : turn === "WAIT_ARRIVED"
                ? board.arrivedCount === 0
                  ? "도착한 사람이 있어야 할 수 있어요"
                  : "도착자들이 먼저 해야 해요"
                : turn === "SPECTATOR"
                  ? "이번 판에는 참여하지 않아요"
                  : "참가자만 할 수 있어요"}
          </Button>
        )}
        {board.outcome !== null ? (
          <Link
            href={`${roomPath}/game/result`}
            className="bg-fill flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold"
          >
            결과 보기
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Rule({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-fill flex items-center justify-between rounded-xl px-4 py-3">
      <dt className="font-medium">{label}</dt>
      <dd className={`font-black ${tone ?? ""}`}>{value}</dd>
    </div>
  );
}
