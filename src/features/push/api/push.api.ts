import { z } from "zod";

import { apiFetch } from "@lib/api/client";

// P2 웹 푸시. 구독 등록은 API 명세서(POST /api/push/subscriptions)에 있고, 요청 본문 형식은 아직 모른다.
// TODO(백엔드 DTO 확정 후): 본문 형식을 맞춘다. 구독 해제(DELETE)는 명세에 없는 가정이다.
// 브라우저가 만든 구독(PushSubscription.toJSON())을 그대로 보낸다.
const subscriptionSchema = z.object({
  endpoint: z.url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export function savePushSubscription(input: unknown): Promise<unknown> {
  const body = subscriptionSchema.parse(input);
  return apiFetch("/api/push/subscriptions", { method: "POST", body });
}

export function removePushSubscription(endpoint: string): Promise<unknown> {
  return apiFetch("/api/push/subscriptions", { method: "DELETE", body: { endpoint } });
}
