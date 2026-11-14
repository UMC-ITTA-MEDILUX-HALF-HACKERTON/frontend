"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { getRoomByCode } from "@features/room/api/room.api";

// 초대 링크로 들어온 사람에게 보여 줄 모임 미리보기.
export function useRoomByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.room.byCode(code).queryKey,
    queryFn: ({ signal }) => getRoomByCode(code, signal),
    retry: false,
  });
}
