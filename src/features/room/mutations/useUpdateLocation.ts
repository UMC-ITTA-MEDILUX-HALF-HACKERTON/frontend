"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { updateLocation } from "@features/room/api/room.api";
import type { UpdateLocationInput } from "@features/room/types/room.types";

interface Variables {
  roomId: string;
  memberId: string;
  input: UpdateLocationInput;
}

// GPS 위치를 보내면 직선 거리와 100m 판정 상태가 돌아온다. 성공하면 모임 정보를 다시 받아 온다.
export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, memberId, input }: Variables) => updateLocation(roomId, memberId, input),
    onSuccess: (_data, { roomId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.room.detail(roomId).queryKey }),
  });
}
