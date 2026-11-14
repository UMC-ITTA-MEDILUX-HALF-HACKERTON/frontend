import { z } from "zod";

import { ApiError } from "./error";

// 백엔드 호출은 전부 이 파일의 apiFetch 를 거친다.
// 응답 형식 (백엔드와 합의):
//   성공 { "success": true, "data": ..., "error": null }
//   실패 { "success": false, "error": { "code": "ROOM_NOT_FOUND", "message": "모임을 찾을 수 없습니다." } }
// TODO(백엔드와 합의 후): 인증(쿠키 credentials 또는 Authorization 헤더)이 정해지면 buildInit 한 곳만 고친다.

interface ApiFetchOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  // data 검증용 zod 스키마. 넘기면 형식이 다를 때 ApiError 를 던진다.
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
}

const envelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string() }).nullable().optional(),
});

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
}

function buildInit(options: { method: string; body?: unknown; signal?: AbortSignal }): RequestInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  return {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  };
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions<T> = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new ApiError("NEXT_PUBLIC_API_BASE_URL 이 설정되지 않았습니다.", 0);

  const { method = "GET", body, schema, signal } = options;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, buildInit({ method, body, signal }));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("서버에 연결하지 못했습니다.", 0);
  }

  const payload = await readBody(response);
  const parsedEnvelope = envelopeSchema.safeParse(payload);
  const envelope = parsedEnvelope.success ? parsedEnvelope.data : null;

  // 실패: HTTP 상태가 실패이거나 success 가 false 이면 백엔드가 준 code 와 message 를 그대로 쓴다.
  if (!response.ok || (envelope && !envelope.success)) {
    throw new ApiError(
      envelope?.error?.message ?? `요청에 실패했습니다. (${response.status})`,
      response.status,
      payload,
      envelope?.error?.code,
    );
  }

  // 본문이 없는 성공 응답(204 등)은 데이터가 없는 것으로 본다.
  if (payload === null) return undefined as T;
  if (!envelope) throw new ApiError("응답 형식이 올바르지 않습니다.", 0, payload);

  const data = envelope.data;
  if (!schema) return data as T;

  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError("응답 형식이 올바르지 않습니다.", 0, payload);
  return parsed.data;
}
