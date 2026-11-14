import { Avatar, type AvatarColor } from "@common/components/Avatar";
import { cn } from "@common/utils/cn";

// 참가자 아바타. PR #8 의 Avatar 에 참가자 순서별 색과 크기를 정해 준다.
// 순서 0, 1, 2, 3 은 보라, 초록, 주황, 분홍이다 (Figma 아바타 색 순서).
const COLORS: AvatarColor[] = ["primary", "mint", "amber", "rose"];

const SIZES = {
  xs: "size-5! text-[10px]!",
  sm: "size-7! text-xs!",
  md: "",
} as const;

export function MemberAvatar({
  nickname,
  index,
  size = "md",
  className,
}: {
  nickname: string;
  index: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const color = COLORS[((index % COLORS.length) + COLORS.length) % COLORS.length];
  return <Avatar name={nickname} color={color} className={cn(SIZES[size], className)} />;
}
