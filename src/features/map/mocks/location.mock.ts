import type { LocationResult } from "@features/map/api/location.api";
import type {
  LocationUpdateBody,
  MemberLocation,
  ServerGpsStatus,
} from "@features/map/types/location.types";
import { distanceM, GPS_POLICY } from "@features/map/utils/gps-policy";
import { mockRoomApi } from "@features/room/mocks/room.mock";
import type { Member, Room } from "@features/room/types/room.types";

// 백엔드 없이(NEXT_PUBLIC_USE_MOCK=true) 위치 화면을 확인하기 위한 가짜 위치 서버.
// 내가 보낸 위치는 localStorage 에 저장하고, 다른 데모 참가자는 mock 모임의 상태와 거리로 위치를 만든다.
// 실제 백엔드처럼 100m 안이면 NEARBY_GPS_OFF 로 판정한다.

const KEY = "mock-locations-v1";
const M_PER_DEG_LAT = 111_320;

interface Stored {
  lat: number;
  lng: number;
  distanceM: number;
  status: ServerGpsStatus;
  updatedAt: number;
}

type Db = Record<string, Record<string, Stored>>;

function load(): Db {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Db) : {};
  } catch {
    return {};
  }
}

function save(db: Db): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // 저장하지 못하면 이번 방문에서만 유지된다.
  }
}

// 약속 장소에서 distance(m) 만큼 떨어진 좌표. 참가자마다 방향을 다르게 둔다.
function offset(room: Room, distance: number, index: number) {
  const lat0 = room.placeLat ?? 0;
  const lng0 = room.placeLng ?? 0;
  const bearing = ((index * 97 + 30) * Math.PI) / 180;
  const dLat = (distance * Math.cos(bearing)) / M_PER_DEG_LAT;
  const dLng = (distance * Math.sin(bearing)) / (M_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180));
  return { lat: lat0 + dLat, lng: lng0 + dLng };
}

function demoLocation(room: Room, member: Member, index: number, now: number): MemberLocation {
  if (member.status === "GPS_OFF" || member.distanceM === null) {
    return {
      memberId: member.id,
      status: "NOT_SHARING",
      distanceM: null,
      updatedAt: null,
      lat: null,
      lng: null,
    };
  }
  const point = offset(room, member.distanceM, index);
  return {
    memberId: member.id,
    status: member.distanceM <= GPS_POLICY.radiusM ? "NEARBY_GPS_OFF" : "SHARING",
    distanceM: member.distanceM,
    updatedAt: now,
    ...point,
  };
}

function withDelay<T>(value: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => Promise.resolve().then(value).then(resolve, reject), 80);
  });
}

export const mockLocationApi = {
  updateLocation(roomId: string, memberId: string, body: LocationUpdateBody) {
    return withDelay(async (): Promise<LocationResult> => {
      const room = await mockRoomApi.getRoom(roomId);
      const place = { lat: room.placeLat ?? 0, lng: room.placeLng ?? 0 };
      const point = { lat: body.latitude, lng: body.longitude };
      const distance = distanceM(point, place);
      const status: ServerGpsStatus = distance <= GPS_POLICY.radiusM ? "NEARBY_GPS_OFF" : "SHARING";
      const db = load();
      db[roomId] = {
        ...db[roomId],
        [memberId]: { ...point, distanceM: distance, status, updatedAt: Date.now() },
      };
      save(db);
      return { distanceM: distance, status };
    });
  },

  getLocations(roomId: string) {
    return withDelay(async (): Promise<MemberLocation[]> => {
      const room = await mockRoomApi.getRoom(roomId);
      const stored = load()[roomId] ?? {};
      const now = Date.now();
      return room.members.map((member, index) => {
        const mine = stored[member.id];
        if (mine) {
          return {
            memberId: member.id,
            status: mine.status,
            distanceM: mine.distanceM,
            updatedAt: mine.updatedAt,
            lat: mine.lat,
            lng: mine.lng,
          };
        }
        return demoLocation(room, member, index, now);
      });
    });
  },
};
