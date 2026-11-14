import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { apiFetch } from "./client";
import { ApiError } from "./error";

const fetchMock = vi.fn();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function ok(data: unknown): Response {
  return json({ success: true, data, error: null });
}

function fail(code: string, message: string, status = 404): Response {
  return json({ success: false, error: { code, message } }, status);
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://api.test/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("기본 주소와 경로를 합쳐 GET 요청을 보내고 data 를 꺼낸다", async () => {
    fetchMock.mockResolvedValue(ok({ ok: true }));
    await expect(apiFetch("/ping")).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/ping");
  });

  it("body 가 있으면 JSON 으로 보낸다", async () => {
    fetchMock.mockResolvedValue(ok({}));
    await apiFetch("/x", { method: "POST", body: { a: 1 } });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("data 가 없는 성공 응답은 undefined 를 돌려준다", async () => {
    fetchMock.mockResolvedValue(json({ success: true, error: null }));
    await expect(apiFetch("/x")).resolves.toBeUndefined();
  });

  it("본문이 없는 성공 응답도 undefined 를 돌려준다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiFetch("/x")).resolves.toBeUndefined();
  });

  it("실패 응답은 백엔드의 code 와 message 를 담은 ApiError 로 던진다", async () => {
    fetchMock.mockResolvedValue(fail("ROOM_NOT_FOUND", "모임을 찾을 수 없습니다."));
    await expect(apiFetch("/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      code: "ROOM_NOT_FOUND",
      message: "모임을 찾을 수 없습니다.",
    });
  });

  it("HTTP 200 이어도 success 가 false 이면 ApiError 로 던진다", async () => {
    fetchMock.mockResolvedValue(fail("INVALID", "잘못된 요청입니다.", 200));
    await expect(apiFetch("/x")).rejects.toMatchObject({ code: "INVALID", status: 200 });
  });

  it("래퍼 없는 실패 응답은 상태 코드만 담은 ApiError 로 던진다", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));
    await expect(apiFetch("/x")).rejects.toMatchObject({ status: 500, code: null });
  });

  it("성공 응답이 래퍼 형식이 아니면 ApiError 로 던진다", async () => {
    fetchMock.mockResolvedValue(json({ id: 1 }));
    await expect(apiFetch("/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("스키마와 다른 data 는 ApiError 로 던진다", async () => {
    fetchMock.mockResolvedValue(ok({ id: 1 }));
    await expect(apiFetch("/x", { schema: z.object({ id: z.string() }) })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("스키마와 맞는 data 는 검증된 값을 돌려준다", async () => {
    fetchMock.mockResolvedValue(ok({ id: "a" }));
    await expect(apiFetch("/x", { schema: z.object({ id: z.string() }) })).resolves.toEqual({
      id: "a",
    });
  });

  it("네트워크 오류는 status 0 인 ApiError 로 던진다", async () => {
    fetchMock.mockRejectedValue(new TypeError("fail"));
    await expect(apiFetch("/x")).rejects.toMatchObject({ status: 0 });
  });

  it("기본 주소가 없으면 요청 전에 ApiError 를 던진다", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    await expect(apiFetch("/x")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
