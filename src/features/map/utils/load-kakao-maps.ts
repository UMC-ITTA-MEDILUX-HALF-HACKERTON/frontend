import type { KakaoNamespace } from "@features/map/types/kakao";

// 카카오지도 SDK 를 한 번만 불러온다. 여러 지도가 동시에 불러도 같은 Promise 를 쓴다.
// autoload=false 로 받은 뒤 kakao.maps.load 콜백에서 지도 객체를 쓸 수 있다.
// libraries=services 는 2단계(약속 장소 검색)에서 쓴다.
const SDK_URL = "https://dapi.kakao.com/v2/maps/sdk.js";
const LOAD_TIMEOUT_MS = 10_000;

// 카카오 개발자 콘솔의 JavaScript 키. 키가 없으면 지도를 띄우지 않고 안내만 보여 준다.
export const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

let pending: Promise<KakaoNamespace> | null = null;

export function buildSdkUrl(appKey: string): string {
  const params = new URLSearchParams({ appkey: appKey, autoload: "false", libraries: "services" });
  return `${SDK_URL}?${params.toString()}`;
}

export function loadKakaoMaps(appKey: string = KAKAO_MAP_KEY): Promise<KakaoNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("카카오지도는 브라우저에서만 불러올 수 있습니다."));
  }
  if (!appKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY 가 설정되지 않았습니다."));
  }
  if (pending) return pending;

  pending = new Promise<KakaoNamespace>((resolve, reject) => {
    const fail = (message: string) => {
      window.clearTimeout(timer);
      script.remove();
      // 실패하면 다음 호출에서 다시 시도할 수 있게 비운다.
      pending = null;
      reject(new Error(message));
    };

    // 등록되지 않은 도메인이나 잘못된 키면 load 콜백이 오지 않을 수 있어 시간 제한을 둔다.
    const timer = window.setTimeout(
      () => fail("카카오지도 로딩 시간이 초과됐습니다. 키와 등록 도메인을 확인해 주세요."),
      LOAD_TIMEOUT_MS,
    );

    const script = document.createElement("script");
    script.src = buildSdkUrl(appKey);
    script.async = true;
    script.onerror = () => fail("카카오지도 SDK 를 내려받지 못했습니다.");
    script.onload = () => {
      const kakao = window.kakao;
      if (!kakao?.maps) {
        fail("카카오지도 SDK 를 초기화하지 못했습니다. 키와 등록 도메인을 확인해 주세요.");
        return;
      }
      kakao.maps.load(() => {
        window.clearTimeout(timer);
        resolve(kakao);
      });
    };
    document.head.appendChild(script);
  });

  return pending;
}
