"use client";

import { useMutation } from "@tanstack/react-query";

import { joinRoom } from "@features/room/api/room.api";
import type { JoinRoomInput } from "@features/room/types/room.types";

// 응답의 memberId 를 저장하고, 참가자 토큰이 따로 오면 setParticipantToken 으로 저장한다 (필드명은 DTO 확정 후).
export function useJoinRoom() {
  return useMutation({ mutationFn: (input: JoinRoomInput) => joinRoom(input) });
}
