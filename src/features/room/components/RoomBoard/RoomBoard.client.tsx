"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useNow } from "@common/hooks/useNow";
import { cn } from "@common/utils/cn";
import { useGpsTracker } from "@features/map/hooks/useGpsTracker";
import { useRoomLocations } from "@features/map/queries/useRoomLocations";
import { mergeLocations } from "@features/map/utils/merge-locations";
import { DecideTab } from "@features/room/components/DecideTab/DecideTab.client";
import { MockMeSwitcher } from "@features/room/components/MockMeSwitcher/MockMeSwitcher.client";
import { StatusTab } from "@features/room/components/StatusTab/StatusTab.client";
import { useMyMemberId } from "@features/room/hooks/useMyMemberId";
import { useCandidates } from "@features/room/queries/useCandidates";
import { useRoom } from "@features/room/queries/useRoom";

type Tab = "status" | "decide";

// S-002, S-005 모임 보드. 현황 탭과 정하기 탭이 있고, 탭은 주소의 ?tab= 으로 기억한다.
export function RoomBoard({ roomId }: { roomId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "decide" ? "decide" : "status";

  const { data: baseRoom, isPending, isError } = useRoom(roomId);
  const { data: board } = useCandidates(roomId);
  const meId = useMyMemberId(roomId);

  // 위치 공유 (F-002). 참가자일 때만 위치를 받고 보낸다. 실패해도 다른 화면은 그대로 동작한다.
  const isMemberOfBase = !!baseRoom && baseRoom.members.some((m) => m.id === meId);
  const { data: locations } = useRoomLocations(roomId, isMemberOfBase);
  const now = useNow(5_000);
  const tracker = useGpsTracker({
    roomId,
    meId: isMemberOfBase ? meId : null,
    place:
      baseRoom && baseRoom.placeLat !== null && baseRoom.placeLng !== null
        ? { lat: baseRoom.placeLat, lng: baseRoom.placeLng }
        : null,
    appointmentAt: baseRoom?.appointmentAt ?? "",
    serverNearOff: !!locations?.some((l) => l.memberId === meId && l.status === "NEARBY_GPS_OFF"),
  });
  const room = baseRoom
    ? mergeLocations(baseRoom, locations, isMemberOfBase ? tracker.self : null, now)
    : undefined;

  function selectTab(next: Tab) {
    router.replace(next === "decide" ? `${pathname}?tab=decide` : pathname, { scroll: false });
  }

  if (isPending) return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;
  if (isError || !room) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-lg font-black">모임을 찾을 수 없어요</p>
        <Link href="/" className="text-primary text-sm font-bold">
          처음으로
        </Link>
      </div>
    );
  }

  const isMember = room.members.some((m) => m.id === meId);

  return (
    <div className="flex flex-1 flex-col">
      <MockMeSwitcher roomId={roomId} />
      <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h1 className="truncate text-lg font-black">{room.name}</h1>
        <button
          type="button"
          aria-label="더보기"
          disabled
          className="bg-fill flex size-10 shrink-0 items-center justify-center rounded-xl text-lg"
        >
          ⋯
        </button>
      </header>

      <div role="tablist" aria-label="모임 보드" className="bg-fill mx-5 mb-4 flex rounded-2xl p-1">
        <TabButton active={tab === "status"} onClick={() => selectTab("status")}>
          현황
        </TabButton>
        <TabButton active={tab === "decide"} onClick={() => selectTab("decide")}>
          정하기
          {tab !== "decide" && board && board.candidates.length > 0 ? (
            <span className="bg-primary ml-1.5 inline-flex size-[18px] items-center justify-center rounded-full text-[10px] text-white">
              {board.candidates.length}
            </span>
          ) : null}
        </TabButton>
      </div>

      {meId !== null && !isMember ? (
        <div className="bg-primary-soft mx-5 mb-4 rounded-2xl p-4 text-center text-sm">
          <p className="font-bold">아직 이 모임에 참여하지 않았어요</p>
          <Link
            href={`/join/${encodeURIComponent(room.code)}`}
            className="text-primary mt-1 inline-block font-black"
          >
            참여하러 가기
          </Link>
        </div>
      ) : null}

      {tab === "status" ? (
        <StatusTab room={room} meId={meId} tracker={isMember ? tracker : null} />
      ) : (
        <DecideTab room={room} meId={meId} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-bold transition",
        active ? "text-ink bg-white shadow-sm" : "text-sub",
      )}
    >
      {children}
    </button>
  );
}
