import { describe, expect, it } from "vitest";

import {
  combineDateTime,
  formatAppointment,
  formatClock,
  formatCountdown,
  formatDistance,
  formatWon,
  lateMinutes,
  toDateInput,
  toTimeInput,
} from "./time";

describe("combineDateTime", () => {
  it("날짜와 시각을 합친 ISO 를 돌려준다", () => {
    const iso = combineDateTime("2026-11-14", "19:00");
    expect(iso).not.toBeNull();
    const date = new Date(iso as string);
    expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([2026, 11, 14]);
    expect([date.getHours(), date.getMinutes()]).toEqual([19, 0]);
  });

  it("형식이 틀리면 null", () => {
    expect(combineDateTime("2026/11/14", "19:00")).toBeNull();
    expect(combineDateTime("2026-11-14", "7pm")).toBeNull();
  });
});

describe("toDateInput, toTimeInput", () => {
  it("로컬 날짜와 시각을 입력 형식으로 만든다", () => {
    const date = new Date(2026, 10, 4, 9, 5);
    expect(toDateInput(date)).toBe("2026-11-04");
    expect(toTimeInput(date)).toBe("09:05");
  });
});

describe("formatAppointment", () => {
  it("오후 7시를 한국어 형식으로 보여 준다", () => {
    expect(formatAppointment(new Date(2026, 10, 14, 19, 0).toISOString())).toBe(
      "11월 14일 (토) 오후 7:00",
    );
  });

  it("정오와 자정은 12시로 보여 준다", () => {
    expect(formatAppointment(new Date(2026, 10, 14, 12, 30).toISOString())).toContain("오후 12:30");
    expect(formatAppointment(new Date(2026, 10, 14, 0, 5).toISOString())).toContain("오전 12:05");
  });
});

describe("formatClock", () => {
  it("HH:mm 으로 보여 준다", () => {
    expect(formatClock(new Date(2026, 10, 14, 8, 7).toISOString())).toBe("08:07");
  });
});

describe("formatCountdown", () => {
  it("남은 시간은 mm:ss", () => {
    expect(formatCountdown(12 * 60_000 + 34_000)).toBe("12:34");
  });

  it("1시간 이상이면 h:mm:ss", () => {
    expect(formatCountdown(3_723_000)).toBe("1:02:03");
  });

  it("지났으면 + 를 붙인다", () => {
    expect(formatCountdown(-(6 * 60_000 + 12_000))).toBe("+06:12");
  });
});

describe("lateMinutes", () => {
  const appointment = new Date(2026, 10, 14, 19, 0).toISOString();

  it("늦은 만큼 분 단위로 계산한다", () => {
    expect(lateMinutes(appointment, new Date(2026, 10, 14, 19, 6, 59).toISOString())).toBe(6);
  });

  it("일찍 왔으면 0", () => {
    expect(lateMinutes(appointment, new Date(2026, 10, 14, 18, 52).toISOString())).toBe(0);
  });
});

describe("formatWon, formatDistance", () => {
  it("금액에 천 단위 쉼표와 원을 붙인다", () => {
    expect(formatWon(3000)).toBe("3,000원");
  });

  it("1km 미만은 m, 이상은 km", () => {
    expect(formatDistance(400)).toBe("400m");
    expect(formatDistance(1200)).toBe("1.2km");
  });
});
