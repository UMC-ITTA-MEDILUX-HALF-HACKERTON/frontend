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
import { useStartGame } from "@features/room/mutations/useStartGame";
import { gameTurn } from "@features/room/utils/game";
import { formatWon } from "@features/room/utils/time";
import { ApiError } from "@lib/api/error";

// S-003a 지각비 게임 규칙 확인. 방장이 시작하면 지각자 팀과 도착자 팀이 정해지고, 두 팀의 평균 점수를 비교한다.
export function GameIntroView({ roomId }: { roomId: string }) {
  const { data: room } = useRoom(roomId);
  const { data: board } = useGameResult(roomId);
  const meId = useMyMemberId(roomId);
  const start = useStartGame();

  const roomPath = `/rooms/${encodeURIComponent(roomId)}`;

  if (!room || !board) return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;

  const turn = gameTurn(room, board, meId);
  if (turn === "NO_GAME") {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="지각비 게임" onBack={() => history.back()} />
        <p className="text-sub p-8 text-center text-sm">
          모두 도착해서 지각비 게임은 필요 없어요 🎉
        </p>
      </div>
    );
  }

  // 시작 전에는 도착 여부로, 시작한 뒤에는 서버가 정한 팀으로 보여 준다.
  const started = board.status !== "NOT_STARTED";
  const lateNames = started
    ? board.lateMembers.map((m) => m.nickname)
    : room.members.filter((m) => m.status !== "ARRIVED").map((m) => m.nickname);
  const onTimeCount = started
    ? board.onTimeTotalCount
    : room.members.filter((m) => m.status === "ARRIVED").length;
  const lateLabel =
    lateNames.length > 1 ? `${lateNames[0]} 외 ${lateNames.length - 1}명` : lateNames[0];
  const doneCount = board.scores.length;
  const totalCount = started ? board.lateTotalCount + board.onTimeTotalCount : 0;
  const startError =
    start.error instanceof ApiError
      ? start.error.message
      : start.error
        ? "게임을 시작하지 못했어요. 잠시 후 다시 시도해 주세요."
        : null;

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
            {lateLabel} vs 도착자 {onTimeCount}명
          </h2>
          <p className="text-sub mt-1 text-xs">한 판씩 달려서 팀 평균 점수를 비교해요</p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="bg-fill rounded-2xl py-3 text-center">
            <p className="text-sub text-[11px]">지각자 팀</p>
            <p className="text-lg font-black">{lateNames.length}명</p>
          </div>
          <span className="text-primary text-sm font-black">VS</span>
          <div className="bg-fill rounded-2xl py-3 text-center">
            <p className="text-sub text-[11px]">도착자 팀</p>
            <p className="text-lg font-black">{onTimeCount}명</p>
          </div>
        </div>

        <dl className="flex flex-col gap-2 text-sm">
          <Rule label="🎉 지각자 팀이 이기면" value="면제" tone="text-mint" />
          <Rule label="🤝 비기면" value={formatWon(room.baseFee)} />
          <Rule label="😅 지면" value={formatWon(room.baseFee * 2)} tone="text-coral" />
        </dl>

        <section aria-label="참여 현황" className="mt-1">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-black">참여 현황</h3>
            <span className="text-sub text-xs">
              {started ? `${doneCount}/${totalCount} 완료` : "시작 전"}
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
        {startError ? <p className="text-coral text-xs font-medium">{startError}</p> : null}
      </div>

      <div className="flex flex-col gap-2 px-5 pt-4 pb-6">
        {turn === "PLAY" ? (
          <Link
            href={`${roomPath}/game/play`}
            className="bg-primary flex h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(91,76,245,0.35)]"
          >
            내 차례 시작하기
          </Link>
        ) : turn === "START" ? (
          <Button
            className={btn({ size: "lg", full: true })}
            disabled={start.isPending}
            onClick={() => start.mutate(roomId)}
          >
            {start.isPending ? "시작하는 중..." : "게임 시작하기"}
          </Button>
        ) : (
          <Button className={btn({ size: "lg", full: true })} disabled>
            {turn === "DONE"
              ? board.status === "FINISHED"
                ? "게임이 끝났어요"
                : "이미 플레이했어요"
              : turn === "WAIT_START"
                ? "방장이 시작하면 할 수 있어요"
                : "참가자만 할 수 있어요"}
          </Button>
        )}
        {board.status === "FINISHED" || board.outcome !== "PENDING" ? (
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
