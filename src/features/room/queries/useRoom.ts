"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { getRoom } from "@features/room/api/room.api";

// 웹소켓을 쓰지 않으므로 참가자 목록과 위치 변화는 주기적으로 다시 받아 온다.
export const ROOM_REFRESH_MS = 5_000;

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: queryKeys.room.detail(roomId).queryKey,
    queryFn: ({ signal }) => getRoom(roomId, signal),
    refetchInterval: ROOM_REFRESH_MS,
  });
}
