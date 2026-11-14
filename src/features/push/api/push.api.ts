import { z } from "zod";

import { apiFetch } from "@lib/api/client";

// TODO(백엔드와 합의 후): 아래 경로, 메서드, 요청 본문 형식은 가정이다. 백엔드 명세에 맞춰 고친다.
// 브라우저가 만든 구독(PushSubscription.toJSON())을 그대로 보낸다.
const subscriptionSchema = z.object({
  endpoint: z.url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export function savePushSubscription(input: unknown): Promise<unknown> {
  const body = subscriptionSchema.parse(input);
  return apiFetch("/push/subscriptions", { method: "POST", body });
}

export function removePushSubscription(endpoint: string): Promise<unknown> {
  return apiFetch("/push/subscriptions", { method: "DELETE", body: { endpoint } });
}
