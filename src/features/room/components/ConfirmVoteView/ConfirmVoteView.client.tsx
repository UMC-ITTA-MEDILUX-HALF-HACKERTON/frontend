"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MemberAvatar } from "@features/room/components/MemberAvatar/MemberAvatar";
import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { Modal } from "@common/components/Modal/Modal";
import { PageHeader } from "@common/components/PageHeader/PageHeader";
import { StatusChip } from "@common/components/StatusChip";
import { useNow } from "@common/hooks/useNow";
import { cn } from "@common/utils/cn";
import { useMyMemberId } from "@features/room/hooks/useMyMemberId";
import { useDecision } from "@features/room/mutations/useDecision";
import { useNudge } from "@features/room/mutations/useNudge";
import { useCandidates } from "@features/room/queries/useCandidates";
import { useRoom } from "@features/room/queries/useRoom";
import { candidateEmoji } from "@features/room/utils/candidate-emoji";
import { formatCountdown } from "@features/room/utils/time";
import { ApiError } from "@lib/api/error";

// S-005b 투표 확정하기 (주최자). 결과를 보고 후보 하나를 골라 확정한다.
export function ConfirmVoteView({ roomId }: { roomId: string }) {
  const router = useRouter();
  const meId = useMyMemberId(roomId);
  const { data: room } = useRoom(roomId);
  const { data: board } = useCandidates(roomId);
  const decision = useDecision();
  const nudge = useNudge();
  const now = useNow(1000);
  const [picked, setPicked] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nudged, setNudged] = useState<string[]>([]);

  const backToBoard = () => router.push(`/rooms/${encodeURIComponent(roomId)}?tab=decide`);

  if (!room || !board) return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;

  const isHost = room.members.some((m) => m.id === meId && m.isHost);
  if (!isHost) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="투표 확정하기" onBack={backToBoard} />
        <p className="text-sub p-8 text-center text-sm">주최자만 확정할 수 있어요.</p>
      </div>
    );
  }

  // 최다 득표 후보. 동점이면 앞에 있는 후보.
  const top = board.candidates.reduce<(typeof board.candidates)[number] | null>(
    (best, c) => (!best || c.voteCount > best.voteCount ? c : best),
    null,
  );
  const selectedId = picked ?? top?.id ?? null;
  const selected = board.candidates.find((c) => c.id === selectedId) ?? null;
  const remaining = new Date(room.appointmentAt).getTime() - now;
  const nonVoters = room.members.filter((m) => board.nonVoterIds.includes(m.id));
  const error =
    decision.error instanceof ApiError
      ? decision.error.message
      : decision.error
        ? "확정하지 못했어요. 잠시 후 다시 시도해 주세요."
        : null;

  function confirm() {
    if (!selected) return;
    decision.mutate({ roomId, input: { candidateId: selected.id } }, { onSuccess: backToBoard });
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="투표 확정하기"
        onBack={backToBoard}
        right={<StatusChip status="host">주최자</StatusChip>}
      />
      <div className="flex flex-1 flex-col gap-3 px-5">
        <div>
          <h2 className="text-lg font-black">2차 어디 갈까?</h2>
          <p className="text-sub text-xs">결과를 보고 하나를 골라 확정해 주세요</p>
        </div>

        <dl className="grid grid-cols-3 gap-2">
          <Stat value={`${board.votedCount}/${board.memberCount}`} label="투표 참여" />
          <Stat value={String(board.candidates.length)} label="후보" />
          <Stat value={formatCountdown(remaining)} label="약속까지" />
        </dl>

        <ul role="radiogroup" aria-label="후보" className="flex flex-col gap-2">
          {board.candidates.map((candidate) => {
            const checked = candidate.id === selectedId;
            const percent =
              board.memberCount > 0
                ? Math.min(100, (candidate.voteCount / board.memberCount) * 100)
                : 0;
            return (
              <li key={candidate.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setPicked(candidate.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 text-left",
                    checked ? "border-primary" : "border-ink/10",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                      checked ? "border-primary" : "border-ink/20",
                    )}
                  >
                    {checked ? <span className="bg-primary size-2.5 rounded-full" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {candidateEmoji(candidate)} {candidate.name}
                      {top && candidate.id === top.id && candidate.voteCount > 0 ? (
                        <StatusChip status="late">최다 득표</StatusChip>
                      ) : null}
                    </span>
                    <span className="bg-fill mt-2 block h-1.5 overflow-hidden rounded-full">
                      <span
                        className="bg-primary block h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </span>
                  <span className="text-primary text-sm font-black">{candidate.voteCount}표</span>
                </button>
              </li>
            );
          })}
        </ul>

        {nonVoters.map((member) => {
          const sent = nudged.includes(member.id);
          return (
            <div key={member.id} className="bg-fill flex items-center gap-3 rounded-2xl px-4 py-3">
              <MemberAvatar
                nickname={member.nickname}
                index={room.members.findIndex((m) => m.id === member.id)}
                size="sm"
              />
              <p className="flex-1 text-xs font-medium">
                {member.nickname}님이 아직 투표 안 했어요
              </p>
              <Button
                variant="soft"
                className={btn({ size: "sm" })}
                disabled={sent || nudge.isPending}
                onClick={() =>
                  nudge.mutate(undefined, { onSuccess: () => setNudged((p) => [...p, member.id]) })
                }
              >
                {sent ? "보냈어요" : "🔔 콕 찌르기"}
              </Button>
            </div>
          );
        })}
        {error ? <p className="text-coral text-sm font-medium">{error}</p> : null}
      </div>
      <div className="px-5 pt-4 pb-6">
        <Button
          className={btn({ size: "lg", full: true })}
          disabled={!selected || decision.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {selected ? `'${selected.name}' 확정하기` : "후보를 골라 주세요"}
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="bg-primary-soft mx-auto flex size-14 items-center justify-center rounded-2xl text-2xl">
          📌
        </div>
        <h3 className="mt-4 text-lg font-black">{selected?.name}으로 확정할까요?</h3>
        <p className="text-sub mt-2 text-xs leading-relaxed">
          확정하면 모두에게 알림이 가고
          <br />
          투표가 마감돼요
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            className={btn({ size: "lg", tone: "fill" })}
            onClick={() => setConfirmOpen(false)}
          >
            취소
          </Button>
          <Button className={btn({ size: "lg" })} onClick={confirm} disabled={decision.isPending}>
            {decision.isPending ? "확정하는 중..." : "확정하기"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-fill rounded-2xl py-3 text-center">
      <dd className="text-[19px] font-black tabular-nums">{value}</dd>
      <dt className="text-sub text-[11px]">{label}</dt>
    </div>
  );
}
