"use client";

import { useEffect, useState } from "react";

// 현재 시각(ms). intervalMs 마다 갱신한다. 카운트다운, 지각 시간 표시에 쓴다.
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
