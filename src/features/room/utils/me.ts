// 이 브라우저에서 "나"는 모임마다 어떤 참가자(memberId)인지, 그 참가자의 인증 토큰은 무엇인지 저장해 둔다.
// 입장, 모임 생성 때 정해진다. 서버 렌더링 중에는 알 수 없으므로 null 이다.
const meKey = (roomId: string) => `me:${roomId}`;
const tokenKey = (roomId: string) => `token:${roomId}`;

// 같은 탭에서 "나"가 바뀌면 이 이벤트로 화면에 알린다 (localStorage 의 storage 이벤트는 다른 탭에만 온다).
export const ME_CHANGED_EVENT = "me-changed";

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 저장소를 쓸 수 없으면 이번 방문에서만 "나"를 알 수 없다.
  }
}

export function getMyMemberId(roomId: string): string | null {
  return read(meKey(roomId));
}

export function setMyMemberId(roomId: string, memberId: string): void {
  write(meKey(roomId), memberId);
  // 브라우저가 아닌 환경(테스트)에서는 이벤트를 보내지 않는다.
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new Event(ME_CHANGED_EVENT));
  }
}

// 백엔드가 모임 생성, 입장 때 준 인증 토큰 (X-Participant-Token 헤더로 보낸다).
export function getRoomToken(roomId: string): string | null {
  return read(tokenKey(roomId));
}

export function setRoomToken(roomId: string, token: string): void {
  write(tokenKey(roomId), token);
}
