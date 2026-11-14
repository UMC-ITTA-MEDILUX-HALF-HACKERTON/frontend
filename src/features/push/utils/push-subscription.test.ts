import { describe, expect, it } from "vitest";

import { sha256Hex, urlBase64ToUint8Array } from "./push-subscription";

describe("urlBase64ToUint8Array", () => {
  it("base64url 문자열을 바이트로 바꾼다", () => {
    // "hello" 의 base64url (패딩 없음)
    expect([...urlBase64ToUint8Array("aGVsbG8")]).toEqual([104, 101, 108, 108, 111]);
  });

  it("- 와 _ 를 + 와 / 로 취급한다", () => {
    // base64 "+/+/" 는 바이트 [251, 255, 191] 이고, base64url 로는 "-_-_" 다
    expect([...urlBase64ToUint8Array("-_-_")]).toEqual([251, 255, 191]);
  });
});

describe("sha256Hex", () => {
  it("알려진 값과 같은 해시를 만든다", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
