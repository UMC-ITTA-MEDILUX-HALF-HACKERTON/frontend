"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(orientation: landscape)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// 화면이 가로 방향인지. 서버 렌더링과 첫 화면에서는 false(세로)로 본다.
export function useIsLandscape(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
