"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { startGame } from "@features/room/api/room.api";

// 방장이 게임을 시작한다 (서버가 팀을 나눈다). 성공하면 게임 상태를 다시 받아 온다.
export function useStartGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => startGame(roomId),
    onSuccess: (_data, roomId) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.room.gameResult(roomId).queryKey }),
  });
}
