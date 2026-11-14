import { cn } from "@common/utils/cn";
import type { ScoreRow } from "@features/room/hooks/useGameSession";
import { padScore } from "@features/room/utils/game";

// 게임 화면 오른쪽 위의 실시간 점수판 (Figma S-003b~d). 게임 화면은 파란 계열 색과 픽셀 서체를 쓴다.
// light: 준비, 플레이 중 / dark: 게임 오버(내 기록 완료, 다른 사람 기다리는 중)
export const GAME_AVATAR_COLORS = ["#2f6bff", "#12b886", "#ff8a3d", "#e64980"] as const;

const PIXEL = "font-[family-name:var(--font-pixel)]";

interface Line {
  label: string;
  // 오른쪽 값. pixel 이면 픽셀 서체로, 아니면 굵은 글씨로 보여 준다.
  value: string;
  pixel?: boolean;
  // 노란색 강조 (예: 평균까지 -58점)
  highlight?: boolean;
}

export function GameScoreboard({
  variant,
  head,
  second,
  bar,
  summary,
  rows,
}: {
  variant: "light" | "dark";
  head: Line;
  second?: Line;
  // 진행 막대: 현재 점수와 목표 점수. 목표 위치에 세로 눈금을 그린다.
  bar?: { current: number; target: number | null };
  summary: Line;
  rows: ScoreRow[];
}) {
  const dark = variant === "dark";
  const subText = dark ? "text-[#b6becd]" : "text-[#6b7385]";
  const mainText = dark ? "text-white" : "text-[#151a24]";

  return (
    <aside
      aria-label="실시간 점수"
      className={cn(
        "pointer-events-none absolute top-3.5 right-4 flex w-[178px] flex-col gap-[5px] rounded-2xl border px-2.5 py-[9px] backdrop-blur-sm",
        dark ? "border-transparent bg-[rgba(21,26,36,0.92)]" : "border-[#e3e8f0] bg-white/90",
      )}
    >
      <LineView line={head} subText={subText} mainText={mainText} size="lg" />
      {second ? <LineView line={second} subText={subText} mainText={mainText} size="lg" /> : null}
      {bar ? <ProgressBar current={bar.current} target={bar.target} /> : null}
      <div className={cn(dark && "pt-[3px]")}>
        <LineView line={summary} subText={subText} mainText={mainText} size="sm" />
      </div>
      <ul className="flex flex-col gap-[3px]">
        {rows.map((row) => (
          <li
            key={row.memberId}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-1.5 py-[3px]",
              row.mine && (dark ? "bg-[rgba(255,212,59,0.18)]" : "bg-[#fff8d6]"),
            )}
          >
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-[8.5px] font-black text-white"
              style={{ backgroundColor: GAME_AVATAR_COLORS[row.index % GAME_AVATAR_COLORS.length] }}
            >
              {Array.from(row.nickname)[0]}
            </span>
            <span className={cn("min-w-0 flex-1 truncate text-[11.5px] font-bold", mainText)}>
              {row.mine ? "나" : row.nickname}
            </span>
            {row.score !== null ? (
              <span className={cn(PIXEL, "text-[8.5px]", mainText)}>{padScore(row.score)}</span>
            ) : (
              <span className={cn("text-[10px]", subText)}>대기 중</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function LineView({
  line,
  subText,
  mainText,
  size,
}: {
  line: Line;
  subText: string;
  mainText: string;
  size: "lg" | "sm";
}) {
  const value = line.pixel ? (
    <span className={cn(PIXEL, size === "lg" ? "text-[9.5px]" : "text-[8.5px]", mainText)}>
      {line.value}
    </span>
  ) : (
    <span
      className={cn(
        "font-bold",
        size === "lg" ? "text-[11px]" : "text-[10.5px]",
        line.highlight ? "text-[#ffd43b]" : size === "lg" ? mainText : subText,
      )}
    >
      {line.value}
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={cn(
          size === "lg" ? "text-[10.5px] font-normal" : "text-[10.5px] font-bold",
          subText,
        )}
      >
        {line.label}
      </span>
      {value}
    </div>
  );
}

// 현재 점수가 목표(도착자 평균)에 얼마나 다가갔는지. 목표 위치에 세로 눈금을 둔다.
function ProgressBar({ current, target }: { current: number; target: number | null }) {
  const scale = target && target > 0 ? target * 1.5 : 300;
  const fill = Math.min(100, (Math.max(0, current) / scale) * 100);
  const mark = target ? Math.min(100, (target / scale) * 100) : null;
  return (
    <div className="relative h-[5px] w-full rounded bg-[#f3f5f9]">
      <div className="h-full rounded bg-[#151a24]/25" style={{ width: `${fill}%` }} />
      {mark !== null ? (
        <span
          aria-hidden
          className="absolute -top-0.5 -bottom-0.5 w-[1.5px] bg-[#151a24]"
          style={{ left: `${mark}%` }}
        />
      ) : null}
    </div>
  );
}
