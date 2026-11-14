import {
  createExampleSchema,
  exampleListSchema,
  exampleSchema,
} from "@features/example/schemas/example.schema";
import type { CreateExampleInput, Example } from "@features/example/types/example.types";
import { apiFetch } from "@lib/api/client";

// 엔드포인트 경로는 백엔드 명세에 맞춰 고친다.
// 서버 컴포넌트는 이 함수를 직접 부르고, 클라이언트 컴포넌트는 queries/, mutations/ 의 훅을 쓴다.
export function getExamples(signal?: AbortSignal): Promise<Example[]> {
  return apiFetch("/examples", { schema: exampleListSchema, signal });
}

export function getExample(id: string, signal?: AbortSignal): Promise<Example> {
  return apiFetch(`/examples/${encodeURIComponent(id)}`, { schema: exampleSchema, signal });
}

export function createExample(input: CreateExampleInput): Promise<Example> {
  const body = createExampleSchema.parse(input);
  return apiFetch("/examples", { method: "POST", body, schema: exampleSchema });
}
