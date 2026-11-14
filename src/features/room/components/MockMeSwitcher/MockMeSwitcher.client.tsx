"use client";

import { useQueryClient } from "@tanstack/react-query";

import { USE_MOCK } from "@common/constants/app";
import { useMyMemberId } from "@features/room/hooks/useMyMemberId";
import { useRoom } from "@features/room/queries/useRoom";
import { setMyMemberId } from "@features/room/utils/me";

// mock 모드에서만 보이는 개발용 도구. "지금 내가 누구인지"를 바꿔서 주최자, 도착자, 지각자 화면을 번갈아 확인한다.
// 화면 맨 위의 얇은 줄이라 다른 내용을 가리지 않는다. 실제 서비스(백엔드 연결)에서는 나타나지 않는다.
export function MockMeSwitcher({ roomId }: { roomId: string }) {
  const queryClient = useQueryClient();
  const { data: room } = useRoom(roomId);
  const meId = useMyMemberId(roomId);

  if (!USE_MOCK || !room) return null;

  return (
    <label className="bg-ink flex items-center justify-between gap-2 px-4 py-1.5 text-[11px] text-white">
      <span>mock · 내 역할</span>
      <select
        value={meId ?? ""}
        onChange={(event) => {
          setMyMemberId(roomId, event.target.value);
          // "나"가 바뀌면 투표 표시 같은 내 기준 데이터를 다시 받아 온다.
          void queryClient.invalidateQueries();
        }}
        className="text-ink rounded bg-white px-1.5 py-0.5 text-[11px] font-bold"
      >
        {room.members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nickname}
            {m.isHost ? " (주최자)" : ""}
            {m.status === "ARRIVED" ? " 도착" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
