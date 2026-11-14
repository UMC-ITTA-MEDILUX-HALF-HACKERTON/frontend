// 웹 푸시 서비스 워커. 서버가 보낸 { title, body, url } 을 알림으로 띄우고, 누르면 해당 화면을 연다.
// TODO(백엔드와 합의 후): 푸시 본문 형식이 { title, body, url } 이 맞는지 확인한다.
// TODO(아이콘 확정 후): showNotification 옵션에 icon, badge 를 추가한다. (예: "/icons/icon-192.png")
const DEFAULT_URL = "/";

self.addEventListener("push", (event) => {
  let data = { title: "알림", body: "새 알림이 있습니다.", url: DEFAULT_URL };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // 형식이 다르면 기본 문구를 쓴다.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
      tag: data.url,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let target;
  try {
    target = new URL(event.notification.data?.url || DEFAULT_URL, self.location.origin);
  } catch {
    target = new URL(DEFAULT_URL, self.location.origin);
  }
  // 같은 출처의 경로만 연다.
  const url =
    target.origin === self.location.origin ? target.href : self.location.origin + DEFAULT_URL;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
