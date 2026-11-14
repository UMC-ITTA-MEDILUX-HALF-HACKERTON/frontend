// 푸시를 지원하지 않는 환경에서 "푸시 알림 켜기"를 눌렀을 때 보여 줄 안내.
// iPhone, iPad 의 Safari 는 홈 화면에 추가한 앱에서만 웹 푸시가 동작한다. 그 밖의 환경은 브라우저가 지원하지 않는 경우다.

export const IOS_PUSH_MESSAGE = "푸시 알림은 홈 화면에 추가한 앱에서만 동작합니다.";
export const UNSUPPORTED_PUSH_MESSAGE = "이 브라우저에서는 푸시 알림을 쓸 수 없습니다.";

export function pushUnsupportedMessage(userAgent: string): string {
  return /iPhone|iPad|iPod/i.test(userAgent) ? IOS_PUSH_MESSAGE : UNSUPPORTED_PUSH_MESSAGE;
}
