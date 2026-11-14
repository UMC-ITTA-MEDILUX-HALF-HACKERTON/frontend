"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { getGameResult } from "@features/room/api/room.api";

// 점수 비교, 승패, 지각비. 점수를 낸 사람이 늘 때마다 바뀔 수 있어 화면에 들어올 때 다시 받아 온다.
export function useGameResult(roomId: string) {
  return useQuery({
    queryKey: queryKeys.room.gameResult(roomId).queryKey,
    queryFn: ({ signal }) => getGameResult(roomId, signal),
  });
}
