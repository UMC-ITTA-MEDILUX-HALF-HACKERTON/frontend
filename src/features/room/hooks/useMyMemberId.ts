"use client";

import { useSyncExternalStore } from "react";

import { getMyMemberId, ME_CHANGED_EVENT } from "@features/room/utils/me";

function subscribe(onChange: () => void) {
  window.addEventListener(ME_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ME_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// 이 브라우저에서 "나"의 memberId. 서버 렌더링과 첫 화면에서는 null 이다.
export function useMyMemberId(roomId: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => getMyMemberId(roomId),
    () => null,
  );
}
