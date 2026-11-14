"use client";

import { useMutation } from "@tanstack/react-query";

import { createRoom } from "@features/room/api/room.api";
import type { CreateRoomInput } from "@features/room/types/room.types";
import { setMyMemberId } from "@features/room/utils/me";

// 응답의 memberId 는 주최자로 등록된 "나"이다. 브라우저에 저장해 이후 화면이 쓴다.
export function useCreateRoom() {
  return useMutation({
    mutationFn: (input: CreateRoomInput) => createRoom(input),
    onSuccess: (result) => setMyMemberId(result.roomId, result.memberId),
  });
}
