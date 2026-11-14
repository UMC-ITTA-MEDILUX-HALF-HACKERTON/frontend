"use client";

import Link from "next/link";
import { useState } from "react";

import { MemberAvatar } from "@features/room/components/MemberAvatar/MemberAvatar";
import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { StatusChip } from "@common/components/StatusChip";
import { useNow } from "@common/hooks/useNow";
import { ArrivalSheet } from "@features/room/components/ArrivalSheet/ArrivalSheet.client";
import { MapSlot } from "@features/room/components/MapSlot/MapSlot";
import type { Member, Room } from "@features/room/types/room.types";
import {
  formatClock,
  formatCountdown,
  formatDistance,
  lateMinutes,
} from "@features/room/utils/time";

// S-002 모임 보드 현황 탭. 약속 전에는 남은 시간과 장소 근처 인원, 약속 시각이 지나면 지각 시간과 도착 인원을 보여 준다.
export function StatusTab({ room, meId }: { room: Room; meId: string | null }) {
  const now = useNow(1000);
  const [arrivalOpen, setArrivalOpen] = useState(false);

  const remaining = new Date(room.appointmentAt).getTime() - now;
  const after = remaining < 0;
  const isHost = room.members.some((m) => m.id === meId && m.isHost);

  const indexOf = (member: Member) => room.members.findIndex((m) => m.id === member.id);
  const arrived = room.members.filter((m) => m.status === "ARRIVED");
  const waiting = room.members.filter((m) => m.status !== "ARRIVED");
  const nearCount = room.members.filter(
    (m) => m.status === "NEARBY" || m.status === "ARRIVED",
  ).length;
  // 가장 가까이 오고 있는 지각자 (거리를 모르면 맨 뒤)
  const closestLate = [...waiting].sort(
    (a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity),
  )[0];

  const subText = !after
    ? "기다리는 동안 2차를 정해 보세요"
    : !closestLate
      ? "모두 도착했어요 🎉"
      : closestLate.distanceM !== null
        ? `${closestLate.nickname}님이 ${closestLate.distanceM <= 500 ? "거의 다 왔어요" : "오는 중이에요"} · ${formatDistance(closestLate.distanceM)}`
        : `${closestLate.nickname}님을 기다리고 있어요`;

  const rows = after ? [...arrived, ...waiting] : room.members;

  return (
    <div className="flex flex-col gap-4 px-5 pb-8">
      <section
        aria-label="약속 시간"
        className="bg-ink flex items-center justify-between gap-3 rounded-3xl p-5 text-white"
      >
        <div>
          <p className="text-xs text-white/70">{after ? "약속 시간에서" : "약속까지"}</p>
          <p
            className={`mt-1 text-[38px] leading-none font-black tabular-nums ${after ? "text-yellow" : ""}`}
          >
            {formatCountdown(remaining)}
          </p>
          <p className="mt-2 text-xs text-white/80">{subText}</p>
        </div>
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl"
        >
          {after ? "🏃" : "⏳"}
        </span>
      </section>

      {!after ? <MapSlot room={room} /> : null}

      <section aria-label="참가자 현황">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-black">
            {after
              ? `${arrived.length}/${room.members.length}명 도착`
              : `${nearCount}/${room.members.length}명 장소 근처`}
          </h2>
          {after && isHost ? (
            <Button
              variant="line"
              className={btn({ size: "sm" })}
              onClick={() => setArrivalOpen(true)}
            >
              도착 관리
            </Button>
          ) : (
            <span className="text-sub text-xs">실시간 위치</span>
          )}
        </div>
        <ul className="divide-ink/5 divide-y">
          {rows.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              index={indexOf(member)}
              after={after}
              appointmentAt={room.appointmentAt}
              now={now}
            />
          ))}
        </ul>
      </section>

      {after && room.lateGameEnabled && closestLate ? (
        <section
          aria-label="지각비 게임"
          className="bg-yellow-soft flex items-center gap-3 rounded-2xl p-4"
        >
          <span aria-hidden className="text-3xl">
            🦖
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black">지각비 게임 해 볼래요?</p>
            <p className="text-ink/70 text-xs">이기면 {closestLate.nickname}님 지각비 면제!</p>
          </div>
          <Link
            href={`/rooms/${encodeURIComponent(room.id)}/game`}
            className="bg-ink flex h-8 items-center rounded-lg px-3 text-xs font-bold text-white"
          >
            열기
          </Link>
        </section>
      ) : null}

      {arrivalOpen ? (
        <ArrivalSheet room={room} open={arrivalOpen} onClose={() => setArrivalOpen(false)} />
      ) : null}
    </div>
  );
}

function MemberRow({
  member,
  index,
  after,
  appointmentAt,
  now,
}: {
  member: Member;
  index: number;
  after: boolean;
  appointmentAt: string;
  now: number;
}) {
  const late = lateMinutes(appointmentAt, new Date(now).toISOString());

  let pill: React.ReactNode;
  let sub: string | null = null;
  if (member.status === "ARRIVED") {
    pill = <StatusChip status="arrived">도착 확인 ✓</StatusChip>;
    sub = member.arrivedAt ? `${formatClock(member.arrivedAt)} 도착` : null;
  } else if (after) {
    pill = <StatusChip status="late">{late}분 늦는 중</StatusChip>;
    sub = member.distanceM !== null ? `직선거리 ${formatDistance(member.distanceM)}` : null;
  } else if (member.status === "NEARBY") {
    pill = (
      <StatusChip status="near" dot>
        장소 근처
      </StatusChip>
    );
  } else if (member.status === "GPS_OFF") {
    pill = <StatusChip status="locationOff">위치 꺼짐</StatusChip>;
  } else {
    pill = <StatusChip status="moving">이동 중</StatusChip>;
    sub = member.distanceM !== null ? `직선거리 ${formatDistance(member.distanceM)}` : null;
  }
  if (!after && member.isHost) sub = "주최자";

  return (
    <li className="flex items-center gap-3 py-3">
      <MemberAvatar nickname={member.nickname} index={index} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{member.nickname}</p>
        {sub ? <p className="text-sub text-xs">{sub}</p> : null}
      </div>
      {pill}
    </li>
  );
}
