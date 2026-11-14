"use client";

import { useMutation } from "@tanstack/react-query";

import { joinRoom } from "@features/room/api/room.api";
import type { JoinRoomInput } from "@features/room/types/room.types";
import { setMyMemberId } from "@features/room/utils/me";

// 응답의 memberId 를 "나"로 저장한다.
// TODO(백엔드 DTO 확정 후): 참가자 토큰이 따로 오면 setParticipantToken 으로도 저장한다.
export function useJoinRoom() {
  return useMutation({
    mutationFn: (input: JoinRoomInput) => joinRoom(input),
    onSuccess: (result) => setMyMemberId(result.roomId, result.memberId),
  });
}
