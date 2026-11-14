"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { TextField } from "@common/components/TextField/TextField";
import { APP_NAME, USE_MOCK } from "@common/constants/app";
import { RoomSummaryCard } from "@features/room/components/RoomSummaryCard/RoomSummaryCard";
import { useJoinRoom } from "@features/room/mutations/useJoinRoom";
import { useRoomByCode } from "@features/room/queries/useRoomByCode";
import { nicknameSchema } from "@features/room/schemas/room.schema";
import { ApiError } from "@lib/api/error";

// S-001c 초대받은 사람 입장
export function JoinView({ code }: { code: string }) {
  const router = useRouter();
  const { data: room, isPending, error } = useRoomByCode(code);
  const join = useJoinRoom();
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | undefined>();

  // 실제 백엔드에는 참여 전 미리보기가 없다. 코드와 닉네임만으로 바로 입장한다.
  const preview = USE_MOCK;
  if (preview && isPending) {
    return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;
  }
  if (preview && (error || !room)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-lg font-black">모임을 찾을 수 없어요</p>
        <p className="text-sub text-sm">초대 링크가 맞는지 다시 확인해 주세요.</p>
      </div>
    );
  }

  const host = room?.members.find((m) => m.isHost);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = nicknameSchema.safeParse(nickname);
    if (!parsed.success) {
      setNicknameError(parsed.error.issues[0]?.message);
      return;
    }
    setNicknameError(undefined);
    join.mutate(
      { code, nickname: parsed.data },
      { onSuccess: (result) => router.push(`/rooms/${encodeURIComponent(result.roomId)}`) },
    );
  }

  const joinError =
    join.error instanceof ApiError
      ? join.error.message
      : join.error
        ? "참여하지 못했어요. 잠시 후 다시 시도해 주세요."
        : null;

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <div className="px-5 pt-6">
        <p className="text-primary text-[15px] font-black">{APP_NAME}</p>
        <h1 className="mt-5 text-[26px] leading-tight font-black">
          <span className="text-primary">{host ? `${host.nickname}님` : "친구"}</span>
          {host ? "이" : "가"}
          <br />
          모임에 초대했어요
        </h1>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pt-5">
        {room ? <RoomSummaryCard room={room} extra="members" /> : null}
        <TextField
          label="닉네임"
          placeholder="모임에서 쓸 이름"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          error={nicknameError ?? joinError ?? undefined}
          maxLength={10}
          autoFocus
        />
        <p className="bg-primary-soft text-primary rounded-2xl px-4 py-3 text-xs leading-relaxed font-medium">
          📍 약속 당일에만 위치를 공유해요. 도착 확정은 주최자가 해요.
        </p>
      </div>
      <div className="px-5 pt-4 pb-6">
        <Button type="submit" className={btn({ size: "lg", full: true })} disabled={join.isPending}>
          {join.isPending ? "참여하는 중..." : "참여하기"}
        </Button>
      </div>
    </form>
  );
}
