// 앱 이름과 설명은 여기 한 곳에서만 쓴다. (layout, manifest, 화면 제목)
export const APP_NAME = "너만 빼고 다 옴";
export const APP_DESCRIPTION = "UMC 11th 해커톤 너만 빼고 다 옴";

// true 이면 백엔드를 부르지 않고 features/room/mocks 의 가짜 데이터를 쓴다.
// 백엔드가 준비되면 NEXT_PUBLIC_USE_MOCK 을 지우거나 false 로 바꾼다.
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
