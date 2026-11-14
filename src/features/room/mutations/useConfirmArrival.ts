"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { confirmArrival } from "@features/room/api/room.api";
import type { ConfirmArrivalInput } from "@features/room/types/room.types";

interface Variables {
  roomId: string;
  memberId: string;
  input: ConfirmArrivalInput;
}

// 주최자가 도착 시각을 기록, 수정한다. 성공하면 모임 정보와 게임 결과를 다시 받아 온다 (지각 시간이 바뀐다).
export function useConfirmArrival() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, memberId, input }: Variables) => confirmArrival(roomId, memberId, input),
    onSuccess: (_data, { roomId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.room.detail(roomId).queryKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.room.gameResult(roomId).queryKey }),
      ]),
  });
}
