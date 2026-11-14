"use client";

import { useState } from "react";

import { MemberAvatar } from "@features/room/components/MemberAvatar/MemberAvatar";
import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { StatusChip } from "@common/components/StatusChip";
import { Sheet } from "@common/components/Sheet/Sheet";
import { Toggle } from "@common/components/Toggle";
import { useConfirmArrival } from "@features/room/mutations/useConfirmArrival";
import type { Member, Room } from "@features/room/types/room.types";
import {
  combineDateTime,
  formatClock,
  formatDistance,
  lateMinutes,
  toDateInput,
  toTimeInput,
} from "@features/room/utils/time";
import { ApiError } from "@lib/api/error";

interface Draft {
  arrived: boolean;
  // "HH:mm". 도착 전이면 빈 문자열
  time: string;
}

// S-002 시트 도착 관리 (주최자). 위치는 참고용이고 도착은 주최자가 확정한다.
export function ArrivalSheet({
  room,
  open,
  onClose,
}: {
  room: Room;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="도착 관리"
      badge={<StatusChip status="host">주최자</StatusChip>}
    >
      <ArrivalForm room={room} onClose={onClose} />
    </Sheet>
  );
}

function initialDraft(member: Member): Draft {
  return {
    arrived: member.status === "ARRIVED",
    time: member.arrivedAt ? toTimeInput(new Date(member.arrivedAt)) : "",
  };
}

function ArrivalForm({ room, onClose }: { room: Room; onClose: () => void }) {
  const confirm = useConfirmArrival();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(room.members.map((m) => [m.id, initialDraft(m)])),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appointmentDate = toDateInput(new Date(room.appointmentAt));

  function patch(memberId: string, next: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [memberId]: { ...prev[memberId], ...next } }));
  }

  function toggle(memberId: string, arrived: boolean) {
    patch(memberId, {
      arrived,
      time: arrived ? toTimeInput(new Date()) : "",
    });
  }

  function arrivalIso(draft: Draft): string | null {
    if (!draft.arrived) return null;
    return combineDateTime(appointmentDate, draft.time) ?? new Date().toISOString();
  }

  async function save() {
    setError(null);
    const changed = room.members.filter((member) => {
      const draft = drafts[member.id];
      const before = initialDraft(member);
      return draft.arrived !== before.arrived || draft.time !== before.time;
    });
    try {
      await Promise.all(
        changed.map((member) => {
          const draft = drafts[member.id];
          return confirm.mutateAsync({
            roomId: room.id,
            memberId: member.id,
            input: { arrived: draft.arrived, arrivedAt: arrivalIso(draft) },
          });
        }),
      );
      onClose();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sub -mt-2 text-xs">위치는 참고용이에요. 도착은 주최자가 확정해요.</p>
      {room.members.map((member, index) => {
        const draft = drafts[member.id];
        const iso = arrivalIso(draft);
        const late = iso ? lateMinutes(room.appointmentAt, iso) : 0;
        const nowLate = lateMinutes(room.appointmentAt, new Date().toISOString());

        let locationPill: React.ReactNode = null;
        if (member.status === "GPS_OFF")
          locationPill = <StatusChip status="locationOff">위치 꺼짐</StatusChip>;
        else if (
          member.status === "NEARBY" ||
          (member.status === "ARRIVED" && member.distanceM !== null && member.distanceM <= 100)
        ) {
          locationPill = (
            <StatusChip status="near" dot>
              근처
            </StatusChip>
          );
        } else if (member.distanceM !== null && member.status !== "ARRIVED") {
          locationPill = (
            <span className="text-sub text-xs">{formatDistance(member.distanceM)}</span>
          );
        }

        const detail = draft.arrived
          ? `${draft.time || formatClock(new Date().toISOString())} 도착 · 지각 ${late}분`
          : member.status === "GPS_OFF"
            ? "아직 확인 안 됨"
            : `이동 중 · 지금 ${nowLate}분 늦음`;

        return (
          <div key={member.id} className="bg-fill rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <MemberAvatar nickname={member.nickname} index={index} />
              <p className="flex-1 text-[15px] font-bold">{member.nickname}</p>
              {locationPill}
              <Toggle
                checked={draft.arrived}
                onCheckedChange={(next) => toggle(member.id, next)}
                label={`${member.nickname} 도착 확인`}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 pl-[52px]">
              <p className="text-sub text-xs">{detail}</p>
              {editing === member.id ? (
                <input
                  type="time"
                  autoFocus
                  value={draft.time}
                  onChange={(e) => patch(member.id, { arrived: true, time: e.target.value })}
                  onBlur={() => setEditing(null)}
                  aria-label={`${member.nickname} 도착 시각`}
                  className="border-ink/10 h-8 rounded-lg border bg-white px-2 text-xs font-bold"
                />
              ) : (
                <Button
                  variant="line"
                  className={btn({ size: "sm" })}
                  onClick={() => setEditing(member.id)}
                >
                  {draft.arrived ? "시각 수정" : "시각 입력"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {error ? <p className="text-coral text-sm font-medium">{error}</p> : null}
      <Button
        className={btn({ size: "lg", full: true, className: "mt-2" })}
        onClick={save}
        disabled={confirm.isPending}
      >
        {confirm.isPending ? "저장하는 중..." : "저장하기"}
      </Button>
    </div>
  );
}
