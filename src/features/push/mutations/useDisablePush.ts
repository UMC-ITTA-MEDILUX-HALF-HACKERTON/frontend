"use client";

import { useMutation } from "@tanstack/react-query";

import { removePushSubscription } from "@features/push/api/push.api";
import { getCurrentSubscription } from "@features/push/utils/push-subscription";

// 푸시 끄기: 서버에서 구독을 지우고 브라우저 구독을 끊는다. 서버 호출이 실패해도 브라우저 구독은 반드시 끊는다.
export function useDisablePush() {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const subscription = await getCurrentSubscription();
      if (!subscription) return;
      try {
        await removePushSubscription(subscription.endpoint);
      } finally {
        await subscription.unsubscribe();
      }
    },
  });
}
