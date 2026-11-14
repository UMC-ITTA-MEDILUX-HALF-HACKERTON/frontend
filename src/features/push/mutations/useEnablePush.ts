"use client";

import { useMutation } from "@tanstack/react-query";

import { savePushSubscription } from "@features/push/api/push.api";
import { subscribeToPush, type SubscribeOutcome } from "@features/push/utils/push-subscription";

// 푸시 켜기: 권한 요청, 구독 생성, 서버 저장. 결과가 denied 나 unsupported 이면 서버를 부르지 않는다.
// 공개키는 NEXT_PUBLIC_VAPID_PUBLIC_KEY (백엔드가 정한 값)를 호출하는 쪽에서 넘긴다.
export function useEnablePush() {
  return useMutation<SubscribeOutcome, Error, string>({
    mutationFn: async (publicKey) => {
      const outcome = await subscribeToPush(publicKey);
      if (outcome.status === "subscribed") {
        await savePushSubscription(outcome.subscription.toJSON());
      }
      return outcome;
    },
  });
}
