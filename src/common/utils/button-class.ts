import { cn } from "./cn";

// PR #8 의 Button(variant: primary, soft, line)에 크기와 색을 덧씌우는 클래스.
// cn 은 단순히 이어 붙이기만 하므로, 기본 클래스를 확실히 이기도록 Tailwind 의 중요 표시(!)를 쓴다.
//   <Button className={btn({ size: "lg", full: true })}>확인</Button>
const SIZE = {
  lg: "h-[52px]! rounded-2xl! px-5!", // 화면 아래의 큰 확인 버튼
  md: "h-12! rounded-2xl! px-4!", // 디자인 시스템 기본 버튼
  sm: "h-8! rounded-lg! px-3! text-xs!", // 목록 안의 작은 버튼
} as const;

const TONE = {
  kakao: "bg-yellow! text-ink! shadow-none! hover:bg-yellow!",
  dark: "bg-ink! text-white! shadow-none! hover:bg-ink!",
  fill: "bg-fill! text-ink! shadow-none!",
  // 후보 추가 시트와 게임 화면에서 쓰는 파란 확인 버튼 (Figma: #2F6BFF)
  blue: "bg-[#2f6bff]! text-white! shadow-[0_6px_8px_rgba(47,107,255,0.28)]! hover:bg-[#2f6bff]!",
  // PR #8 의 Button 은 기본으로 border-transparent 를 주고 Line 변형이 border-line 을 덧붙이는데,
  // 두 클래스가 부딪혀 테두리가 보이지 않는다. variant="line" 과 함께 쓰면 테두리 색을 확실히 정한다.
  line: "border-line!",
} as const;

export function btn(options: {
  size?: keyof typeof SIZE;
  full?: boolean;
  tone?: keyof typeof TONE;
  className?: string;
}): string {
  return cn(
    options.size ? SIZE[options.size] : undefined,
    options.full && "w-full",
    options.tone ? TONE[options.tone] : undefined,
    options.className,
  );
}
