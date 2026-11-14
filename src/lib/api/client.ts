import { z } from "zod";

import { ApiError } from "./error";
import { getParticipantToken, PARTICIPANT_TOKEN_HEADER } from "./participant-token";

// 백엔드 호출은 전부 이 파일의 apiFetch 를 거친다.
// 응답 형식은 두 가지를 모두 받는다.
//   백엔드 코드(ApiResponse) { success, data, errorCode, message }
//   합의 문서               { success, data, error: { code, message } }
// 인증: 저장된 참가자 토큰이 있으면 X-Participant-Token 헤더로 보낸다.

interface ApiFetchOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  // data 검증용 zod 스키마. 넘기면 형식이 다를 때 ApiError 를 던진다.
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
  // 이 요청에 쓸 참가자 토큰. 참가자 토큰은 모임마다 다르므로 모임 안의 요청은 그 모임의 토큰을 넘긴다.
  // 넘기지 않으면 저장된 기본 토큰(participant-token.ts)을 쓴다.
  token?: string | null;
  // 이 요청에만 더 붙일 헤더 (예: 위치 API 의 X-Member-Token)
  headers?: Record<string, string>;
  // true 이면 공통 응답 래퍼({ success, data }) 없이 데이터만 오는 응답도 받는다.
  // TODO(백엔드와 확인): 위치 API 가 ApiResponse 로 감싸지면 이 옵션을 지운다.
  allowBareData?: boolean;
}

const envelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string() }).nullable().optional(),
  errorCode: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
});

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
}

function buildInit(options: {
  method: string;
  body?: unknown;
  signal?: AbortSignal;
  token?: string | null;
  headers?: Record<string, string>;
}): RequestInit {
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const token = options.token === undefined ? getParticipantToken() : options.token;
  if (token) headers[PARTICIPANT_TOKEN_HEADER] = token;
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

  const { method = "GET", body, schema, signal, token, headers, allowBareData } = options;
  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}${path}`,
      buildInit({ method, body, signal, token, headers }),
    );
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
      envelope?.error?.message ?? envelope?.message ?? `요청에 실패했습니다. (${response.status})`,
      response.status,
      payload,
      envelope?.error?.code ?? envelope?.errorCode,
    );
  }

  // 본문이 없는 성공 응답(204 등)은 데이터가 없는 것으로 본다.
  if (payload === null) return undefined as T;
  if (!envelope && !allowBareData) throw new ApiError("응답 형식이 올바르지 않습니다.", 0, payload);

  const data = envelope ? envelope.data : payload;
  if (!schema) return data as T;

  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError("응답 형식이 올바르지 않습니다.", 0, payload);
  return parsed.data;
}
