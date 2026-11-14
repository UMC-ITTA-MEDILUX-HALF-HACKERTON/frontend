import type { z } from "zod";

import { ApiError } from "./error";

// 백엔드 호출은 전부 이 파일의 apiFetch 를 거친다.
// TODO(백엔드와 합의 후): 응답 래퍼({ isSuccess, result } 등)가 있으면 unwrap 한 곳만 고친다.
// TODO(백엔드와 합의 후): 인증(쿠키 credentials 또는 Authorization 헤더)이 정해지면 buildInit 한 곳만 고친다.

interface ApiFetchOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  // 응답 검증용 zod 스키마. 넘기면 형식이 다를 때 ApiError 를 던진다.
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
}

// 백엔드 응답 본문에서 실제 데이터를 꺼낸다. 지금은 본문 그대로 쓴다.
function unwrap(body: unknown): unknown {
  return body;
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
  if (!response.ok) {
    throw new ApiError(`요청에 실패했습니다. (${response.status})`, response.status, payload);
  }

  const data = unwrap(payload);
  if (!schema) return data as T;

  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError("응답 형식이 올바르지 않습니다.", 0, payload);
  return parsed.data;
}
