import { KakaoMap } from "@features/map/components/KakaoMap/KakaoMap.client";
import { KAKAO_MAP_KEY } from "@features/map/utils/load-kakao-maps";
import type { Room } from "@features/room/types/room.types";

const BOX = "h-44";

// 현황 탭의 지도 자리. 약속 장소 좌표와 카카오 키가 있으면 카카오지도를, 없으면 안내를 보여 준다.
// 다음 단계에서 room.members 의 위치·GPS 상태로 참가자 마커를 더한다.
export function MapSlot({ room }: { room: Room }) {
  if (room.placeLat === null || room.placeLng === null) {
    return <MapNotice room={room} message="약속 장소 좌표가 없어 지도를 표시할 수 없어요" />;
  }
  if (!KAKAO_MAP_KEY) {
    return (
      <MapNotice room={room} message="지도 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 설정되지 않았어요" />
    );
  }
  return (
    <KakaoMap
      place={{ lat: room.placeLat, lng: room.placeLng }}
      placeName={room.place}
      className={BOX}
    />
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
