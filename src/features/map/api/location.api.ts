import { z } from "zod";

import { USE_MOCK } from "@common/constants/app";
import { mockLocationApi } from "@features/map/mocks/location.mock";
import type { LocationUpdateBody, MemberLocation } from "@features/map/types/location.types";
import { parseServerTime } from "@features/map/utils/gps-policy";
import { getRoomToken } from "@features/room/utils/me";
import { apiFetch } from "@lib/api/client";
import { getParticipantToken } from "@lib/api/participant-token";

// 백엔드 LocationController.
//   PATCH /api/rooms/{roomId}/members/{memberId}/location  내 위치 갱신, 직선 거리, 100m 판정
//   GET   /api/rooms/{roomId}/locations                    참가자 전체 위치 상태
// 현재 백엔드는 이 두 API 만 공통 래퍼(ApiResponse) 없이 응답하고, 인증 헤더도 X-Member-Token 을 따로 읽는다.
// 그래서 allowBareData 를 켜고 X-Participant-Token 과 같은 토큰을 X-Member-Token 에도 넣는다.
// TODO(백엔드와 확인): 다른 API 처럼 ApiResponse 와 X-Participant-Token 으로 맞추면 이 처리를 지운다.

const MEMBER_TOKEN_HEADER = "X-Member-Token";

const idSchema = z.union([z.string(), z.number()]).transform(String);
const gpsStatusSchema = z.enum(["SHARING", "NEARBY_GPS_OFF", "NOT_SHARING"]);

// MemberLocationResponse. latitude, longitude 는 백엔드에 추가를 요청한 필드라 없어도 된다.
const memberLocationSchema = z.object({
  memberId: idSchema,
  distanceMeters: z.number().nullable().optional(),
  gpsStatus: gpsStatusSchema,
  locationUpdatedAt: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

const locationListSchema = z.array(memberLocationSchema);

// LocationResponse
const locationResultSchema = z.object({
  memberId: idSchema,
  distanceMeters: z.number(),
  gpsStatus: gpsStatusSchema,
  locationUpdatedAt: z.string().nullable().optional(),
});

export type LocationResult = {
  distanceM: number;
  status: MemberLocation["status"];
};

export function toMemberLocation(dto: z.infer<typeof memberLocationSchema>): MemberLocation {
  return {
    memberId: dto.memberId,
    status: dto.gpsStatus,
    distanceM: dto.distanceMeters ?? null,
    updatedAt: parseServerTime(dto.locationUpdatedAt),
    lat: dto.latitude ?? null,
    lng: dto.longitude ?? null,
  };
}

function authFor(roomId: string) {
  const token = getRoomToken(roomId) ?? getParticipantToken();
  return {
    token: token ?? undefined,
    headers: token ? { [MEMBER_TOKEN_HEADER]: token } : undefined,
  };
}

const roomPath = (roomId: string) => `/api/rooms/${encodeURIComponent(roomId)}`;

export async function updateMyLocation(
  roomId: string,
  memberId: string,
  body: LocationUpdateBody,
): Promise<LocationResult> {
  if (USE_MOCK) return mockLocationApi.updateLocation(roomId, memberId, body);
  const result = await apiFetch(
    `${roomPath(roomId)}/members/${encodeURIComponent(memberId)}/location`,
    {
      method: "PATCH",
      body,
      schema: locationResultSchema,
      allowBareData: true,
      ...authFor(roomId),
    },
  );
  return { distanceM: result.distanceMeters, status: result.gpsStatus };
}

export async function getRoomLocations(
  roomId: string,
  signal?: AbortSignal,
): Promise<MemberLocation[]> {
  if (USE_MOCK) return mockLocationApi.getLocations(roomId);
  const list = await apiFetch(`${roomPath(roomId)}/locations`, {
    schema: locationListSchema,
    signal,
    allowBareData: true,
    ...authFor(roomId),
  });
  return list.map(toMemberLocation);
}
