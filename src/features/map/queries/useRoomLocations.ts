"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { getRoomLocations } from "@features/map/api/location.api";
import { GPS_POLICY } from "@features/map/utils/gps-policy";

// 참가자 전체 위치 상태. 위치 전송 간격(10초)에 맞춰 다시 받아 온다.
// 실패해도 후보, 투표 흐름을 막지 않도록 재시도하지 않고 마지막 값을 쓴다.
export function useRoomLocations(roomId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.room.locations(roomId).queryKey,
    queryFn: ({ signal }) => getRoomLocations(roomId, signal),
    enabled,
    refetchInterval: GPS_POLICY.sendIntervalMs,
    retry: false,
  });
}
