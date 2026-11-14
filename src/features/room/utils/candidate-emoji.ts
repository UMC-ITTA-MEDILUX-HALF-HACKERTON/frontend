import type { CandidateKind } from "@features/room/types/room.types";

// 후보 이름에서 어울리는 이모지를 고른다 (디자인: 코인노래방 🎤, 포차 🍻, 카페 ☕).
// 맞는 말이 없으면 종류(장소 📍, 활동 🎲)로 정한다.
const RULES: Array<[RegExp, string]> = [
  [/노래|코노|가라오케/, "🎤"],
  [/포차|술|맥주|호프|펍|이자카야|소주|와인/, "🍻"],
  [/카페|커피|디저트|빵/, "☕"],
  [/치킨/, "🍗"],
  [/피자/, "🍕"],
  [/고기|삼겹|갈비|곱창/, "🥩"],
  [/식당|밥|국밥|라멘|파스타|분식/, "🍽️"],
  [/볼링/, "🎳"],
  [/영화/, "🎬"],
  [/pc방|피시방|게임|오락/i, "🎮"],
];

export function candidateEmoji(candidate: { kind: CandidateKind; name: string }): string {
  for (const [pattern, emoji] of RULES) {
    if (pattern.test(candidate.name)) return emoji;
  }
  return candidate.kind === "PLACE" ? "📍" : "🎲";
}
