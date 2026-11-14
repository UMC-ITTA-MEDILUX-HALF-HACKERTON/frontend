"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { RoomSummaryCard } from "@features/room/components/RoomSummaryCard/RoomSummaryCard";
import { useRoom } from "@features/room/queries/useRoom";

// S-001b 초대 링크 공유 (모임 생성 직후)
export function ShareView({ roomId }: { roomId: string }) {
  const { data: room, isPending, isError } = useRoom(roomId);
  const [copied, setCopied] = useState(false);

  if (isPending) return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;
  if (isError || !room) {
    return <p className="text-sub p-8 text-center text-sm">모임을 찾을 수 없어요.</p>;
  }

  // 초대 링크. 코드는 URL 에 그대로 넣는다.
  const link = `${window.location.origin}/join/${encodeURIComponent(room.code)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드를 쓸 수 없으면(권한, 비보안 연결) 링크를 직접 복사하도록 둔다.
    }
  }

  // TODO(카카오 SDK 연동 후): 카카오톡 공유 템플릿으로 보낸다. 지금은 기기 공유 창이나 링크 복사로 대신한다.
  async function invite() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: room?.name, url: link });
        return;
      } catch {
        // 사용자가 공유를 취소했으면 아무것도 하지 않는다.
        return;
      }
    }
    await copy();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end px-5 pt-5">
        <Link
          href={`/rooms/${encodeURIComponent(room.id)}`}
          aria-label="닫고 모임 보드로 가기"
          className="bg-fill flex size-10 items-center justify-center rounded-xl text-lg"
        >
          ✕
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5">
        <div className="mt-2 text-center">
          <div className="bg-yellow-soft mx-auto flex size-16 items-center justify-center rounded-2xl text-3xl">
            🎉
          </div>
          <h2 className="mt-5 text-[22px] font-black">모임이 만들어졌어요!</h2>
          <p className="text-sub mt-2 text-[13px]">링크를 보내면 친구들이 바로 들어올 수 있어요</p>
        </div>
        <RoomSummaryCard room={room} extra="fee" />
        <div className="bg-fill flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <span className="truncate text-sm font-medium">{link.replace(/^https?:\/\//, "")}</span>
          <Button variant="soft" className={btn({ size: "sm" })} onClick={copy}>
            {copied ? "복사됨" : "복사"}
          </Button>
        </div>
        <Button className={btn({ size: "lg", full: true, tone: "kakao" })} onClick={invite}>
          💬 카카오톡으로 초대하기
        </Button>
      </div>
      <div className="px-5 pt-4 pb-6">
        <Link
          href={`/rooms/${encodeURIComponent(room.id)}`}
          className="bg-fill flex h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-bold"
        >
          모임 보드로 가기
        </Link>
      </div>
    </div>
  );
}
