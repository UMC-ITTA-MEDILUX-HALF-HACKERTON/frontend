"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { cn } from "@common/utils/cn";
import { ChatPanel } from "@features/chat/components/ChatPanel/ChatPanel.client";
import { CandidateSheet } from "@features/room/components/CandidateSheet/CandidateSheet.client";
import { useVote } from "@features/room/mutations/useVote";
import { useCandidates } from "@features/room/queries/useCandidates";
import type { Candidate, Room } from "@features/room/types/room.types";
import { candidateEmoji } from "@features/room/utils/candidate-emoji";
import { ApiError } from "@lib/api/error";

// S-005 모임 보드 정하기 탭. 위에는 투표, 아래는 대화다. 후보 줄을 누르면 투표하고, 주최자는 확정 화면으로 간다.
export function DecideTab({ room, meId }: { room: Room; meId: string | null }) {
  const { data: board, isPending } = useCandidates(room.id);
  const vote = useVote();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isPending || !board) {
    return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;
  }

  const isHost = room.members.some((m) => m.id === meId && m.isHost);
  const confirmed = board.candidates.find((c) => c.id === board.confirmedCandidateId) ?? null;
  const host = room.members.find((m) => m.isHost);
  const voteError =
    vote.error instanceof ApiError
      ? vote.error.message
      : vote.error
        ? "투표하지 못했어요. 잠시 후 다시 시도해 주세요."
        : null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-5">
        {confirmed ? <ConfirmedCard candidate={confirmed} /> : null}

        <section aria-label="투표" className="bg-fill rounded-3xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-black">🗳️ 2차 어디 갈까?</h2>
            <span className="text-sub text-xs">
              {confirmed ? "투표 마감" : `${board.votedCount}/${board.memberCount}명 투표`}
            </span>
          </div>

          {confirmed ? (
            <p className="text-sub text-xs">
              {board.candidates.map((c) => `${c.name} ${c.voteCount}`).join(" · ")}
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {board.candidates.length === 0 ? (
                  <li className="text-sub py-4 text-center text-sm">
                    아직 후보가 없어요. 첫 후보를 추가해 보세요.
                  </li>
                ) : null}
                {board.candidates.map((candidate) => {
                  const selected = candidate.id === board.myVoteCandidateId;
                  return (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        disabled={vote.isPending}
                        onClick={() =>
                          vote.mutate({ roomId: room.id, input: { candidateId: candidate.id } })
                        }
                        className={cn(
                          "w-full rounded-2xl bg-white px-3.5 py-3 text-left",
                          selected ? "border-primary border-2" : "border-2 border-transparent",
                        )}
                      >
                        <CandidateBar candidate={candidate} total={board.memberCount} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {voteError ? (
                <p className="text-coral mt-2 text-xs font-medium">{voteError}</p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button
                  variant="line"
                  className={btn({ size: "md", full: true })}
                  onClick={() => setSheetOpen(true)}
                >
                  + 후보 추가
                </Button>
                {isHost ? (
                  <Link
                    href={`/rooms/${encodeURIComponent(room.id)}/confirm`}
                    aria-disabled={board.candidates.length === 0}
                    className={cn(
                      "bg-primary flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-white",
                      board.candidates.length === 0 && "pointer-events-none opacity-40",
                    )}
                  >
                    📌 확정하기
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>

      <ChatPanel
        members={room.members}
        meId={meId}
        confirmedNotice={
          confirmed ? `${host?.nickname ?? "주최자"}님이 '${confirmed.name}'으로 확정했어요` : null
        }
      />

      <CandidateSheet roomId={room.id} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

function CandidateBar({ candidate, total }: { candidate: Candidate; total: number }) {
  const percent = total > 0 ? Math.min(100, (candidate.voteCount / total) * 100) : 0;
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">
          {candidateEmoji(candidate)} {candidate.name}
        </span>
        <span className="text-primary text-xs font-black">{candidate.voteCount}</span>
      </div>
      <div className="bg-fill mt-2 h-1.5 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </>
  );
}

// 확정된 후보 안내. 지도 링크가 있으면 길찾기로 연결한다.
function ConfirmedCard({ candidate }: { candidate: Candidate }) {
  const link =
    candidate.mapLink && /^https?:\/\//.test(candidate.mapLink) ? candidate.mapLink : null;
  return (
    <section
      aria-label="확정된 장소"
      className="bg-mint-soft flex items-center gap-3 rounded-2xl p-4"
    >
      <span aria-hidden className="text-2xl">
        📌
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-mint-ink text-[15px] font-black">2차는 {candidate.name}!</p>
        <p className="text-mint-ink/80 truncate text-xs">
          {link ? "지도 링크가 있어요" : "투표가 마감됐어요"}
        </p>
      </div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-mint rounded-lg px-3 py-2 text-xs font-bold text-white"
        >
          길찾기
        </a>
      ) : null}
    </section>
  );
}
