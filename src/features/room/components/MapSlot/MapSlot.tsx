import type { Room } from "@features/room/types/room.types";

// 약속 장소와 참가자 위치를 보여 주는 지도 자리. 지도는 다른 담당자가 구현한다.
// 이 컴포넌트의 안쪽만 바꿔서 지도(카카오 지도 등)를 넣으면 현황 탭이 그대로 동작한다.
// room.place 는 약속 장소 이름이고, room.members 의 distanceM, status 로 마커를 그릴 수 있다.
export function MapSlot({ room }: { room: Room }) {
  return (
    <div
      data-slot="map"
      aria-label={`${room.place} 지도 영역`}
      className="bg-fill text-sub flex h-44 items-center justify-center rounded-2xl text-xs"
    >
      지도 영역
    </div>
  );
}
