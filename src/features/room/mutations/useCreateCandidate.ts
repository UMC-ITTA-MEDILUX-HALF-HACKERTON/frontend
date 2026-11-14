"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@common/constants/query-keys";
import { createCandidate } from "@features/room/api/room.api";
import type { CreateCandidateInput } from "@features/room/types/room.types";

interface Variables {
  roomId: string;
  input: CreateCandidateInput;
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, input }: Variables) => createCandidate(roomId, input),
    onSuccess: (_data, { roomId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.room.candidates(roomId).queryKey }),
  });
}
