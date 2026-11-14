// 브라우저 쪽 푸시 구독 처리. 서버 호출은 하지 않는다 (서버 호출은 api/push.api.ts).

export const SERVICE_WORKER_PATH = "/sw.js";

// VAPID 공개키(base64url)를 PushManager.subscribe 가 받는 형태로 바꾼다.
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

// 구독 주소의 SHA-256 (16진수). "이 기기"를 목록에서 찾을 때 쓴다.
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 이 브라우저가 서비스 워커와 푸시를 지원하는지. 서버 렌더링 중에는 false.
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export type SubscribeOutcome =
  | { status: "subscribed"; subscription: PushSubscription }
  | { status: "denied" }
  | { status: "unsupported" };

// 알림 권한을 묻고, 서비스 워커를 등록하고, 구독을 만든다 (이미 있으면 그대로 쓴다).
// 만든 구독을 서버에 저장하는 일은 호출하는 쪽이 한다.
export async function subscribeToPush(publicKey: string): Promise<SubscribeOutcome> {
  if (!publicKey || !isPushSupported()) return { status: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  return { status: "subscribed", subscription };
}
