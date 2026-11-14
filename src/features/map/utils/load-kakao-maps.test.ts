import { describe, expect, it } from "vitest";

import { roomSchema } from "@features/room/schemas/room.schema";
import { buildSdkUrl, loadKakaoMaps } from "@features/map/utils/load-kakao-maps";

describe("카카오지도 SDK 로더", () => {
  it("autoload=false 와 services 라이브러리를 붙여 SDK 주소를 만든다", () => {
    const url = new URL(buildSdkUrl("abc&123"));
    expect(url.origin + url.pathname).toBe("https://dapi.kakao.com/v2/maps/sdk.js");
    expect(url.searchParams.get("appkey")).toBe("abc&123");
    expect(url.searchParams.get("autoload")).toBe("false");
    expect(url.searchParams.get("libraries")).toBe("services");
  });

  it("브라우저가 아니면 불러오지 않고 거절한다", async () => {
    await expect(loadKakaoMaps("key")).rejects.toThrow("브라우저");
  });
});

describe("모임 응답의 약속 장소 좌표", () => {
  const base = {
    id: "r",
    code: "c",
    name: "모임",
    place: "강남역",
    appointmentAt: "2026-11-14T10:00:00.000Z",
    lateGameEnabled: true,
    baseFee: 0,
    members: [],
    confirmedCandidateId: null,
  };

  it("좌표가 빠진 응답은 null 로 채운다", () => {
    const room = roomSchema.parse(base);
    expect(room.placeLat).toBeNull();
    expect(room.placeLng).toBeNull();
  });

  it("좌표를 그대로 받는다", () => {
    const room = roomSchema.parse({ ...base, placeLat: 37.497952, placeLng: 127.027619 });
    expect(room.placeLat).toBe(37.497952);
    expect(room.placeLng).toBe(127.027619);
  });

  it("범위를 벗어난 위도는 거절한다", () => {
    expect(() => roomSchema.parse({ ...base, placeLat: 91, placeLng: 127 })).toThrow();
  });
});
