import { removePushSubscription } from "@features/push/api/push.api";
import { getCurrentSubscription } from "@features/push/utils/push-subscription";

// 로그아웃할 때 이 기기의 푸시 구독을 서버와 브라우저에서 해제한다.
// 그대로 두면 로그아웃한 뒤에도 이전 계정의 알림이 이 기기에 계속 뜨고,
// 다음에 이 기기로 로그인한 다른 계정의 구독과 부딪힌다.
// 서버 해제는 로그인된 상태에서만 할 수 있으므로 반드시 로그아웃 요청보다 먼저 부른다.
// 실패하거나 오래 걸려도 로그아웃을 막지 않는다.
const TIMEOUT_MS = 3000;

export async function releasePushOnThisDevice(): Promise<void> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return;
    await Promise.race([
      removePushSubscription(subscription.endpoint).catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS)),
    ]);
    // 서버에 못 알려도 브라우저 쪽 구독은 반드시 끊는다
    await subscription.unsubscribe();
  } catch {
    // 로그아웃을 막지 않는다.
  }
}
