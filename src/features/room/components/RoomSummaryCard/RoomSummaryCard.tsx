import { MemberAvatar } from "@features/room/components/MemberAvatar/MemberAvatar";
import { cn } from "@common/utils/cn";
import type { Room } from "@features/room/types/room.types";
import { formatAppointment, formatWon } from "@features/room/utils/time";

// 보라색 모임 요약 카드. 공유 화면(지각비 줄 포함)과 초대받은 사람 화면(참여 인원 줄 포함)에서 쓴다.
export function RoomSummaryCard({
  room,
  extra,
  className,
}: {
  room: Room;
  extra: "fee" | "members";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-primary relative overflow-hidden rounded-3xl p-5 text-white",
        "shadow-[0_10px_24px_rgba(91,76,245,0.28)]",
        className,
      )}
    >
      <span aria-hidden className="absolute -top-8 -right-8 size-28 rounded-full bg-white/10" />
      <h2 className="relative text-[17px] font-black">{room.name}</h2>
      <ul className="relative mt-3 space-y-1.5 text-[13px] font-medium text-white/90">
        <li>📍 {room.place}</li>
        <li>🕖 {formatAppointment(room.appointmentAt)}</li>
        {extra === "fee" && room.lateGameEnabled ? (
          <li>💸 지각비 게임 켜짐 · {formatWon(room.baseFee)}</li>
        ) : null}
      </ul>
      {extra === "members" ? (
        <div className="relative mt-3 flex items-center gap-2">
          <div className="flex -space-x-2">
            {room.members.slice(0, 3).map((member, index) => (
              <MemberAvatar
                key={member.id}
                nickname={member.nickname}
                index={index}
                size="sm"
                className="ring-2 ring-white"
              />
            ))}
          </div>
          <span className="text-xs font-medium text-white/90">{room.members.length}명 참여 중</span>
        </div>
      ) : null}
    </div>
  );
}
