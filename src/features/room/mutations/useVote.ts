"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { putVote } from "@features/room/api/room.api";
import type { VoteInput } from "@features/room/types/room.types";

interface Variables {
  roomId: string;
  input: VoteInput;
}

// 1인 1표. 같은 사람이 다시 보내면 투표가 바뀐다. 성공하면 후보 목록(투표 수, 미응답 인원)을 다시 받아 온다.
export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, input }: Variables) => putVote(roomId, input),
    onSuccess: (_data, { roomId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.room.candidates(roomId).queryKey }),
  });
}
