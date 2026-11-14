"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { USE_MOCK } from "@common/constants/app";
import { getRoomByCode } from "@features/room/api/room.api";

// 초대 링크로 들어온 사람에게 보여 줄 모임 미리보기. 실제 백엔드에는 코드로 조회하는 API 가 없어 mock 에서만 쓴다.
export function useRoomByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.room.byCode(code).queryKey,
    queryFn: ({ signal }) => getRoomByCode(code, signal),
    enabled: USE_MOCK,
    retry: false,
  });
}
