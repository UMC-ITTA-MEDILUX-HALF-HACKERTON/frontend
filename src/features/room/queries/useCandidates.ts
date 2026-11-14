"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { getCandidates } from "@features/room/api/room.api";
import { ROOM_REFRESH_MS } from "@features/room/queries/useRoom";

// 후보 목록, 투표 수, 미응답 인원. 다른 사람의 투표가 보이도록 주기적으로 다시 받아 온다.
export function useCandidates(roomId: string) {
  return useQuery({
    queryKey: queryKeys.room.candidates(roomId).queryKey,
    queryFn: ({ signal }) => getCandidates(roomId, signal),
    refetchInterval: ROOM_REFRESH_MS,
  });
}
