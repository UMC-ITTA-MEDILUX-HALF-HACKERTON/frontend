"use client";

import { useState } from "react";

import { Button } from "@common/components/Button";
import { Sheet } from "@common/components/Sheet/Sheet";
import { TextField } from "@common/components/TextField/TextField";
import { btn } from "@common/utils/button-class";
import { cn } from "@common/utils/cn";
import { useCreateCandidate } from "@features/room/mutations/useCreateCandidate";
import { candidateInputSchema } from "@features/room/schemas/room.schema";
import type { CandidateKind } from "@features/room/types/room.types";
import { ApiError } from "@lib/api/error";

// S-005 시트 후보 추가. 장소 또는 활동 하나를 후보로 올린다.
// 이 시트는 Figma 에서 파란 포인트색(#2F6BFF)을 쓴다.
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

// 추천 활동. 누르면 입력칸에 이름이 들어간다.
const SUGGESTIONS = [
  { icon: "🎳", name: "볼링" },
  { icon: "🎤", name: "노래방" },
  { icon: "🎮", name: "PC방" },
  { icon: "🔐", name: "방탈출" },
  { icon: "🎱", name: "당구" },
  { icon: "📸", name: "인생네컷" },
] as const;

const DURATIONS = [
  { minutes: 30, label: "30분" },
  { minutes: 60, label: "1시간" },
  { minutes: 120, label: "2시간+" },
] as const;

// 입력칸: 평소에는 회색, 포커스하면 흰 바탕에 파란 테두리 (Figma 후보 추가 시트)
const FIELD = "h-[50px]! rounded-[14px]! text-[14.5px]! focus:border-[#2f6bff]!";

function CandidateForm({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const create = useCreateCandidate();
  const [kind, setKind] = useState<CandidateKind>("PLACE");
  const [name, setName] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [minutes, setMinutes] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = candidateInputSchema.safeParse({
      kind,
      name,
      mapLink: kind === "PLACE" && mapLink ? mapLink : undefined,
      expectedMinutes: kind === "ACTIVITY" && minutes ? minutes : undefined,
    });
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
    <form onSubmit={submit} className="flex flex-col gap-[13px]">
      <div role="tablist" aria-label="후보 종류" className="flex gap-1.5">
        {KINDS.map((item) => (
          <button
            key={item.kind}
            type="button"
            role="tab"
            aria-selected={kind === item.kind}
            onClick={() => setKind(item.kind)}
            className={cn(
              "rounded-[11px] px-3.5 py-2 text-[13px] font-bold",
              kind === item.kind ? "bg-[#151a24] text-white" : "bg-[#f3f5f9] text-[#6b7385]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <TextField
        label={kind === "PLACE" ? "장소 이름" : "무엇을 할까요?"}
        placeholder={kind === "PLACE" ? "예) 근처 카페" : "예) 볼링 한 게임"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error}
        maxLength={30}
        className={FIELD}
        autoFocus
      />

      {kind === "PLACE" ? (
        <TextField
          label="지도 링크"
          optionalLabel="선택"
          placeholder="네이버·카카오맵 링크 붙여넣기"
          value={mapLink}
          onChange={(e) => setMapLink(e.target.value)}
          maxLength={300}
          className={FIELD}
        />
      ) : (
        <>
          <div className="flex flex-col gap-[7px]">
            <p className="text-[12.5px] font-bold text-[#151a24]">추천 활동</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((item) => {
                const selected = name.length > 0 && name.startsWith(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setName(item.name)}
                    className={cn(
                      "rounded-full px-[11px] py-[7px] text-[12.5px] font-bold",
                      selected ? "bg-[#eaf1ff] text-[#1c4fd8]" : "bg-[#f3f5f9] text-[#6b7385]",
                    )}
                  >
                    {item.icon} {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            <p className="text-[12.5px] font-bold text-[#151a24]">
              예상 시간 <span className="font-normal text-[#a6aebd]">(선택)</span>
            </p>
            <div className="flex gap-1.5">
              {DURATIONS.map((item) => {
                const selected = minutes === item.minutes;
                return (
                  <button
                    key={item.minutes}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setMinutes(selected ? null : item.minutes)}
                    className={cn(
                      "rounded-[11px] px-3.5 py-2 text-[13px] font-bold",
                      selected ? "bg-[#151a24] text-white" : "bg-[#f3f5f9] text-[#6b7385]",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {serverError ? <p className="text-coral text-sm font-medium">{serverError}</p> : null}
      <Button
        type="submit"
        className={btn({ size: "lg", full: true, tone: "blue", className: "h-[54px]!" })}
        disabled={create.isPending}
      >
        {create.isPending ? "추가하는 중..." : "추가하기"}
      </Button>
    </form>
  );
}
