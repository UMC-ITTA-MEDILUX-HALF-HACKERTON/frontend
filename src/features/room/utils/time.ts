// 시간 표시와 계산. 순수 함수만 둔다 (테스트 가능하게).

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

// "YYYY-MM-DD" (브라우저 로컬 날짜)
export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "HH:mm" (브라우저 로컬 시각)
export function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "YYYY-MM-DD" + "HH:mm" 을 로컬 시각의 ISO 문자열로 합친다. 형식이 틀리면 null.
export function combineDateTime(date: string, time: string): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const result = new Date(
    Number(d[1]),
    Number(d[2]) - 1,
    Number(d[3]),
    Number(t[1]),
    Number(t[2]),
    0,
    0,
  );
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

// "11월 14일 (금) 오후 7:00"
export function formatAppointment(iso: string): string {
  const date = new Date(iso);
  const hour = date.getHours();
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAYS[date.getDay()]}) ${period} ${hour12}:${pad(date.getMinutes())}`;
}

// "11/14 (금)"
export function formatShortDate(date: Date): string {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} (${DAYS[date.getDay()]})`;
}

// "오후 7:00"
export function formatTimeOfDay(date: Date): string {
  const hour = date.getHours();
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour < 12 ? "오전" : "오후"} ${hour12}:${pad(date.getMinutes())}`;
}

// "18:52"
export function formatClock(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 약속까지 남은 시간. remainingMs 가 0 이상이면 "12:34"(1시간 이상이면 "1:02:03"), 지났으면 "+06:12".
export function formatCountdown(remainingMs: number): string {
  const sign = remainingMs < 0 ? "+" : "";
  const totalSeconds = Math.floor(Math.abs(remainingMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const body =
    hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  return `${sign}${body}`;
}

// 지각 시간(분). 약속 시각보다 늦은 만큼이고 일찍 왔으면 0. (지각 시간 = max(0, 도착 - 약속))
export function lateMinutes(appointmentIso: string, arrivedIso: string): number {
  const diff = new Date(arrivedIso).getTime() - new Date(appointmentIso).getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

// "3,000원"
export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

// "1.2km" 또는 "400m"
export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
}
