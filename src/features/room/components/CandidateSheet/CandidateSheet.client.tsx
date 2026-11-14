"use client";

import { useState } from "react";

import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { Sheet } from "@common/components/Sheet/Sheet";
import { TextField } from "@common/components/TextField/TextField";
import { cn } from "@common/utils/cn";
import { useCreateCandidate } from "@features/room/mutations/useCreateCandidate";
import { candidateInputSchema } from "@features/room/schemas/room.schema";
import type { CandidateKind } from "@features/room/types/room.types";
import { ApiError } from "@lib/api/error";

// S-005 시트 후보 추가. 장소 또는 활동 하나를 후보로 올린다.
export function CandidateSheet({
  roomId,
  open,
  onClose,
}: {
  roomId: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="후보 추가">
      <CandidateForm roomId={roomId} onClose={onClose} />
    </Sheet>
  );
}

const KINDS: Array<{ kind: CandidateKind; label: string }> = [
  { kind: "PLACE", label: "📍 장소" },
  { kind: "ACTIVITY", label: "🎲 활동" },
];

function CandidateForm({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const create = useCreateCandidate();
  const [kind, setKind] = useState<CandidateKind>("PLACE");
  const [name, setName] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [error, setError] = useState<string | undefined>();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = candidateInputSchema.safeParse({ kind, name, mapLink: mapLink || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    create.mutate({ roomId, input: parsed.data }, { onSuccess: onClose });
  }

  const serverError =
    create.error instanceof ApiError
      ? create.error.message
      : create.error
        ? "후보를 추가하지 못했어요. 잠시 후 다시 시도해 주세요."
        : null;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div role="tablist" aria-label="후보 종류" className="flex gap-2">
        {KINDS.map((item) => (
          <button
            key={item.kind}
            type="button"
            role="tab"
            aria-selected={kind === item.kind}
            onClick={() => setKind(item.kind)}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs font-bold",
              kind === item.kind ? "bg-ink text-white" : "bg-fill text-sub",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <TextField
        label="이름"
        placeholder={kind === "PLACE" ? "예) 근처 카페" : "예) 코인노래방"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error}
        maxLength={30}
        autoFocus
      />
      <TextField
        label="지도 링크"
        optionalLabel="선택"
        placeholder="네이버·카카오맵 링크 붙여넣기"
        value={mapLink}
        onChange={(e) => setMapLink(e.target.value)}
        maxLength={300}
      />
      {serverError ? <p className="text-coral text-sm font-medium">{serverError}</p> : null}
      <Button type="submit" className={btn({ size: "lg", full: true })} disabled={create.isPending}>
        {create.isPending ? "추가하는 중..." : "추가하기"}
      </Button>
    </form>
  );
}
