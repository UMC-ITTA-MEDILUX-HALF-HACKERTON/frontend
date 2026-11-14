import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { apiFetch } from "./client";
import { ApiError } from "./error";

const fetchMock = vi.fn();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
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
  it("기본 주소와 경로를 합쳐 GET 요청을 보낸다", async () => {
    fetchMock.mockResolvedValue(json({ ok: true }));
    await expect(apiFetch("/ping")).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/ping");
  });

  it("body 가 있으면 JSON 으로 보낸다", async () => {
    fetchMock.mockResolvedValue(json({}));
    await apiFetch("/x", { method: "POST", body: { a: 1 } });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("실패 상태는 ApiError 로 던진다", async () => {
    fetchMock.mockResolvedValue(json({ message: "no" }, 404));
    await expect(apiFetch("/x")).rejects.toMatchObject({ name: "ApiError", status: 404 });
  });

  it("스키마와 다른 응답은 ApiError 로 던진다", async () => {
    fetchMock.mockResolvedValue(json({ id: 1 }));
    await expect(apiFetch("/x", { schema: z.object({ id: z.string() }) })).rejects.toBeInstanceOf(
      ApiError,
    );
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
