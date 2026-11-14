"use client";

import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { KakaoMap, type MapMarker } from "@features/map/components/KakaoMap/KakaoMap.client";
import type { GpsTracker } from "@features/map/hooks/useGpsTracker";
import type { TrackerState } from "@features/map/types/location.types";
import { KAKAO_MAP_KEY } from "@features/map/utils/load-kakao-maps";
import type { Room } from "@features/room/types/room.types";
import { formatDistance } from "@features/room/utils/time";

const BOX = "h-44";

// 현황 탭의 지도. 약속 장소, 위치를 공유한 참가자 마커, 내 위치 공유 상태를 보여 준다.
// 장소 근처로 GPS 가 꺼졌거나 위치를 공유하지 않는 사람은 마커를 그리지 않는다.
export function MapSlot({
  room,
  meId,
  tracker,
}: {
  room: Room;
  meId: string | null;
  tracker: GpsTracker | null;
}) {
  if (room.placeLat === null || room.placeLng === null) {
    return <MapNotice room={room} message="약속 장소 좌표가 없어 지도를 표시할 수 없어요" />;
  }

  const markers: MapMarker[] = room.members.flatMap((member) => {
    const gps = member.gps;
    if (!gps || gps.lat === null || gps.lng === null) return [];
    if (gps.state !== "SHARING" && gps.state !== "STALE") return [];
    return [
      {
        id: member.id,
        lat: gps.lat,
        lng: gps.lng,
        label: member.id === meId ? "나" : member.nickname,
        tone: gps.state === "STALE" ? "stale" : member.id === meId ? "me" : "member",
      },
    ];
  });

  return (
    <div className="flex flex-col gap-2">
      {KAKAO_MAP_KEY ? (
        <KakaoMap
          place={{ lat: room.placeLat, lng: room.placeLng }}
          placeName={room.place}
          markers={markers}
          className={BOX}
        />
      ) : (
        <MapNotice room={room} message="지도 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 설정되지 않았어요" />
      )}
      {tracker && meId ? <MyGpsBar room={room} meId={meId} tracker={tracker} /> : null}
    </div>
  );
}

const MESSAGE: Record<Exclude<TrackerState, "sharing" | "idle">, string> = {
  outside_window: "위치 공유는 약속 당일에만 켤 수 있어요",
  unsupported: "이 브라우저에서는 위치를 쓸 수 없어요 (https 필요). 투표는 그대로 할 수 있어요",
  starting: "위치를 확인하는 중이에요",
  denied: "위치 미공유 · 브라우저 설정에서 위치 권한을 허용해야 해요",
  interrupted: "위치 갱신이 멈췄어요 · 다시 받아 오는 중이에요",
  stopped_near: "장소 근처 · GPS 꺼짐 · 도착은 주최자가 확인해요",
};

function MyGpsBar({ room, meId, tracker }: { room: Room; meId: string; tracker: GpsTracker }) {
  const me = room.members.find((m) => m.id === meId);
  const distance = tracker.self?.distanceM ?? null;

  if (tracker.state === "idle") {
    return (
      <div className="bg-fill flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <p className="text-sub text-xs">위치를 공유하면 약속 장소까지 거리가 친구들에게 보여요</p>
        <Button
          type="button"
          className={btn({ size: "sm", className: "shrink-0" })}
          onClick={tracker.start}
        >
          위치 공유
        </Button>
      </div>
    );
  }

  const text =
    tracker.state === "sharing"
      ? distance !== null
        ? `약속 장소까지 ${formatDistance(distance)} · 위치 공유 중`
        : "위치 공유 중"
      : MESSAGE[tracker.state];

  return (
    <p
      aria-live="polite"
      className="bg-fill text-sub rounded-2xl px-4 py-3 text-xs"
      data-gps-state={tracker.state}
    >
      {me?.status === "ARRIVED" && tracker.state !== "sharing" ? "도착 확인 완료 · " : null}
      {text}
    </p>
  );
}

function MapNotice({ room, message }: { room: Room; message: string }) {
  return (
    <div
      data-slot="map"
      aria-label={`${room.place} 지도 영역`}
      className={`bg-fill text-sub flex ${BOX} items-center justify-center rounded-2xl px-4 text-center text-xs`}
    >
      {message}
    </div>
  );
}
