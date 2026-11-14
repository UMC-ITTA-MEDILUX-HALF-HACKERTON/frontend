"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { getGameResult } from "@features/room/api/room.api";
import { ROOM_REFRESH_MS } from "@features/room/queries/useRoom";

// 점수 비교, 승패, 지각비. 다른 사람이 점수를 내면 바뀌므로 주기적으로 다시 받아 온다.
export function useGameResult(roomId: string) {
  return useQuery({
    queryKey: queryKeys.room.gameResult(roomId).queryKey,
    queryFn: ({ signal }) => getGameResult(roomId, signal),
    refetchInterval: ROOM_REFRESH_MS,
  });
}
