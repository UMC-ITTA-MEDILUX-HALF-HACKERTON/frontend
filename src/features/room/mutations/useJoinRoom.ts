"use client";

import { useMutation } from "@tanstack/react-query";

import { joinRoom } from "@features/room/api/room.api";
import type { JoinRoomInput } from "@features/room/types/room.types";
import { setMyMemberId } from "@features/room/utils/me";
import { setParticipantToken } from "@lib/api/participant-token";

// 응답의 memberId 를 "나"로, token 을 이후 요청의 X-Participant-Token 으로 저장한다.
export function useJoinRoom() {
  return useMutation({
    mutationFn: (input: JoinRoomInput) => joinRoom(input),
    onSuccess: (result) => {
      setMyMemberId(result.roomId, result.memberId);
      if (result.token) setParticipantToken(result.token);
    },
  });
}
