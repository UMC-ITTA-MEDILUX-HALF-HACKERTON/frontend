import type { ReactNode } from "react";

import { cn } from "@common/utils/cn";

export type ChipStatus = "near" | "moving" | "locationOff" | "arrived" | "late" | "host" | "fine";

const STATUS_CLASS: Record<ChipStatus, string> = {
  near: "bg-mint-soft text-mint-ink", // 장소 근처
  moving: "bg-fill text-sub", // 이동 중 · 1.2km
  locationOff: "bg-amber-soft text-amber-ink", // 위치 꺼짐
  arrived: "bg-mint text-white", // 도착 확인 ✓
  late: "bg-yellow-soft text-yellow-ink", // 6분 늦는 중
  host: "bg-primary-soft text-primary", // 주최자
  fine: "bg-coral-soft text-coral-ink", // 지각비
};

type StatusChipProps = {
  status: ChipStatus;
  children: ReactNode;
  dot?: boolean;
  className?: string;
};

export function StatusChip({ status, children, dot = false, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "text-caption inline-flex h-5.5 items-center gap-1 rounded-full px-2 font-bold whitespace-nowrap",
        STATUS_CLASS[status],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-2 rounded-full bg-current" />}
      {children}
    </span>
  );
}
