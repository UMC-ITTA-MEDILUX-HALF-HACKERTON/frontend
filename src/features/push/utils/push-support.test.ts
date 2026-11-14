import { describe, expect, it } from "vitest";

import { IOS_PUSH_MESSAGE, pushUnsupportedMessage, UNSUPPORTED_PUSH_MESSAGE } from "./push-support";

describe("pushUnsupportedMessage", () => {
  it("iPhone 과 iPad 에는 홈 화면 추가 안내를 준다", () => {
    expect(pushUnsupportedMessage("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe(
      IOS_PUSH_MESSAGE,
    );
    expect(pushUnsupportedMessage("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe(IOS_PUSH_MESSAGE);
  });

  it("그 밖의 환경에는 지원하지 않는다는 안내를 준다", () => {
    expect(pushUnsupportedMessage("Mozilla/5.0 (Windows NT 10.0) Chrome/120")).toBe(
      UNSUPPORTED_PUSH_MESSAGE,
    );
  });
});
