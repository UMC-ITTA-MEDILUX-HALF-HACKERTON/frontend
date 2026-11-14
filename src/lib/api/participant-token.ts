// 백엔드는 로그인 대신 X-Participant-Token 헤더로 참가자를 구분한다 (공개 경로 제외).
// 이 토큰이 join 응답의 어떤 필드인지는 백엔드 DTO가 정해지면 확인한다.
// 브라우저의 localStorage 에만 두고, 서버 렌더링 중에는 없는 것으로 본다.

export const PARTICIPANT_TOKEN_HEADER = "X-Participant-Token";
const STORAGE_KEY = "participant-token";

export function getParticipantToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setParticipantToken(token: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // 저장소를 쓸 수 없으면(사생활 보호 모드 등) 이번 방문에서만 쓰지 못한다.
  }
}

export function clearParticipantToken(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시한다.
  }
}
