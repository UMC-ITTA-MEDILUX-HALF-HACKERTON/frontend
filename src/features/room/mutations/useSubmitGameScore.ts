"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { submitGameScore } from "@features/room/api/room.api";
import type { GameScoreInput } from "@features/room/types/room.types";

interface Variables {
  roomId: string;
  input: GameScoreInput;
}

// T-Rex 점수를 제출한다. 성공하면 게임 결과(평균, 승패, 지각비)를 다시 받아 온다.
export function useSubmitGameScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, input }: Variables) => submitGameScore(roomId, input),
    onSuccess: (_data, { roomId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.room.gameResult(roomId).queryKey }),
  });
}
