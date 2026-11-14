"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@common/components/Button";
import { btn } from "@common/utils/button-class";
import { PageHeader } from "@common/components/PageHeader/PageHeader";
import { PickerField } from "@common/components/PickerField/PickerField";
import { TextField } from "@common/components/TextField/TextField";
import { Toggle } from "@common/components/Toggle";
import { PlaceSearchField } from "@features/room/components/PlaceSearchField/PlaceSearchField.client";
import { useCreateRoom } from "@features/room/mutations/useCreateRoom";
import { createRoomInputSchema } from "@features/room/schemas/room.schema";
import {
  combineDateTime,
  formatShortDate,
  formatTimeOfDay,
  formatWon,
  toDateInput,
  toTimeInput,
} from "@features/room/utils/time";
import { ApiError } from "@lib/api/error";

// S-001a 모임 만들기 (주최자)
export function RoomCreateForm() {
  const router = useRouter();
  const createRoom = useCreateRoom();

  // 기본값은 오늘, 지금부터 1시간 뒤 정각
  const [defaults] = useState(() => {
    const base = new Date(Date.now() + 60 * 60 * 1000);
    base.setMinutes(0, 0, 0);
    return { date: toDateInput(base), time: toTimeInput(base) };
  });
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [place, setPlace] = useState("");
  // 검색 결과에서 고른 장소의 좌표. 장소 이름을 직접 고치면 비운다.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [lateGame, setLateGame] = useState(true);
  const [fee, setFee] = useState("3000");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 필드에는 디자인 형식(11/14 (금), 오후 7:00)으로 보여 준다. 값이 비었거나 틀리면 안내 글자를 보여 준다.
  const picked = combineDateTime(date, time);
  const dateDisplay = date && picked ? formatShortDate(new Date(picked)) : "날짜 선택";
  const timeDisplay = time && picked ? formatTimeOfDay(new Date(picked)) : "시간 선택";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = createRoomInputSchema.safeParse({
      name,
      place,
      lat: coords?.lat,
      lng: coords?.lng,
      nickname,
      date,
      time,
      lateGameEnabled: lateGame,
      baseFee: Number(fee || 0),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    createRoom.mutate(parsed.data, {
      onSuccess: (result) => router.push(`/rooms/${encodeURIComponent(result.roomId)}/share`),
    });
  }

  const serverError =
    createRoom.error instanceof ApiError
      ? createRoom.error.message
      : createRoom.error
        ? "모임을 만들지 못했어요. 잠시 후 다시 시도해 주세요."
        : null;

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <PageHeader title="모임 만들기" />
      <div className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-6">
        <TextField
          label="모임 이름"
          placeholder="예) 금요일 동아리 회식"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={30}
        />
        <TextField
          label="내 닉네임"
          placeholder="모임에서 쓸 이름"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          error={errors.nickname}
          maxLength={10}
        />
        <PlaceSearchField
          value={place}
          onChange={(value) => {
            setPlace(value);
            setCoords(null);
          }}
          onSelect={(picked) => {
            setPlace(picked.name);
            setCoords({ lat: picked.lat, lng: picked.lng });
          }}
          selected={coords !== null}
          error={errors.place ?? errors.lat}
        />
        <div className="grid grid-cols-2 gap-3">
          <PickerField
            label="날짜"
            type="date"
            value={date}
            display={dateDisplay}
            onChange={setDate}
            error={errors.date}
          />
          <PickerField
            label="시간"
            type="time"
            value={time}
            display={timeDisplay}
            onChange={setTime}
            error={errors.time}
          />
        </div>
        <div className="bg-fill flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5">
          <div>
            <p className="text-sm font-bold">지각비 게임</p>
            <p className="text-sub text-xs">지각자가 생기면 게임을 열 수 있어요 · 선택</p>
          </div>
          <Toggle
            checked={lateGame}
            onCheckedChange={setLateGame}
            label="지각비 게임"
            className={lateGame ? "bg-primary!" : undefined}
          />
        </div>
        <TextField
          label="기본 지각비"
          inputMode="numeric"
          value={fee ? formatWon(Number(fee)) : ""}
          onChange={(e) => setFee(e.target.value.replace(/\D/g, "").slice(0, 7))}
          error={errors.baseFee}
          disabled={!lateGame}
          placeholder="3,000원"
        />
        {serverError ? <p className="text-coral text-sm font-medium">{serverError}</p> : null}
      </div>
      <div className="sticky bottom-0 bg-white px-5 pt-2 pb-6">
        <Button
          type="submit"
          className={btn({ size: "lg", full: true })}
          disabled={createRoom.isPending}
        >
          {createRoom.isPending ? "만드는 중..." : "모임 만들기"}
        </Button>
      </div>
    </form>
  );
}
