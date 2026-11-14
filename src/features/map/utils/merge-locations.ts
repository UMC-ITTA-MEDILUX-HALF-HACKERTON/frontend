import type {
  GpsState,
  MemberGps,
  MemberLocation,
  TrackerState,
} from "@features/map/types/location.types";
import { isStale } from "@features/map/utils/gps-policy";
import type { Member, MemberStatus, Room } from "@features/room/types/room.types";

// 내 기기에서 직접 아는 위치 상태. 서버 응답보다 최신이라 내 줄에는 이것을 먼저 쓴다.
export interface SelfGps {
  memberId: string;
  tracker: TrackerState;
  distanceM: number | null;
  lat: number | null;
  lng: number | null;
  // 마지막 좌표 측정 시각(ms)
  fixedAt: number | null;
}

function fromServer(location: MemberLocation, now: number): MemberGps {
  let state: GpsState;
  if (location.status === "NEARBY_GPS_OFF") state = "NEAR_OFF";
  else if (location.status === "NOT_SHARING") state = "NOT_SHARING";
  // 공유 중이어도 1분 넘게 새 좌표가 없으면 실시간 위치로 보지 않는다.
  else state = isStale(location.updatedAt, now) ? "STALE" : "SHARING";
  return {
    state,
    distanceM: location.distanceM,
    updatedAt: location.updatedAt,
    lat: state === "NEAR_OFF" ? null : location.lat,
    lng: state === "NEAR_OFF" ? null : location.lng,
  };
}

function fromSelf(self: SelfGps, server: MemberGps | null, now: number): MemberGps | null {
  switch (self.tracker) {
    case "stopped_near":
      return {
        state: "NEAR_OFF",
        distanceM: self.distanceM,
        updatedAt: self.fixedAt,
        lat: null,
        lng: null,
      };
    case "denied":
    case "unsupported":
      return { state: "NOT_SHARING", distanceM: null, updatedAt: null, lat: null, lng: null };
    case "sharing":
    case "interrupted":
      if (self.lat === null || self.lng === null) return server;
      return {
        state: isStale(self.fixedAt, now) ? "STALE" : "SHARING",
        distanceM: self.distanceM,
        updatedAt: self.fixedAt,
        lat: self.lat,
        lng: self.lng,
      };
    default:
      return server;
  }
}

function toStatus(member: Member, gps: MemberGps | null): MemberStatus {
  // 도착은 주최자 확인으로만 정한다. GPS 상태로 도착을 바꾸지 않는다.
  if (member.status === "ARRIVED") return "ARRIVED";
  if (!gps) return member.status;
  if (gps.state === "NEAR_OFF") return "NEARBY";
  if (gps.state === "NOT_SHARING") return "GPS_OFF";
  return "MOVING";
}

// 서버 위치 목록과 내 기기 상태를 모임 참가자에 합친다.
export function mergeLocations(
  room: Room,
  locations: MemberLocation[] | undefined,
  self: SelfGps | null,
  now: number,
): Room {
  if (!locations && !self) return room;
  const byId = new Map((locations ?? []).map((l) => [l.memberId, l]));
  const members = room.members.map((member) => {
    const location = byId.get(member.id);
    let gps = location ? fromServer(location, now) : null;
    if (self && self.memberId === member.id) gps = fromSelf(self, gps, now);
    if (!gps) return member;
    return { ...member, gps, status: toStatus(member, gps), distanceM: gps.distanceM };
  });
  return { ...room, members };
}
