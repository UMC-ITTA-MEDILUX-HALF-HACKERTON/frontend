"use client";

import { useMutation } from "@tanstack/react-query";

import { createRoom } from "@features/room/api/room.api";
import type { CreateRoomInput } from "@features/room/types/room.types";

// 응답에 참여 코드와 주최자 memberId 가 온다. 저장은 호출하는 화면에서 한다 (필드명은 DTO 확정 후).
export function useCreateRoom() {
  return useMutation({ mutationFn: (input: CreateRoomInput) => createRoom(input) });
}
