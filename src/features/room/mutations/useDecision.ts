"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { decideCandidate } from "@features/room/api/room.api";
import type { DecisionInput } from "@features/room/types/room.types";

interface Variables {
  roomId: string;
  input: DecisionInput;
}

// 주최자만 확정할 수 있다 (백엔드가 FORBIDDEN 으로 거절한다). 성공하면 모임 정보와 후보를 다시 받아 온다.
export function useDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, input }: Variables) => decideCandidate(roomId, input),
    onSuccess: (_data, { roomId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.room.detail(roomId).queryKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.room.candidates(roomId).queryKey }),
      ]),
  });
}
