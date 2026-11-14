"use client";

import { useMutation } from "@tanstack/react-query";

import { nudgeMember } from "@features/room/api/room.api";

// 투표하지 않은 사람 콕 찌르기. 지금은 mock 에서만 동작한다.
export function useNudge() {
  return useMutation({ mutationFn: () => nudgeMember() });
}
