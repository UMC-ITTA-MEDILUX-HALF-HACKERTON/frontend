import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@common/constants/app";

// PWA 설치 정보. 이름과 설명은 common/constants/app.ts 한 곳에서 바꾼다.
// TODO: 아이콘이 정해지면 public/icons/ 에 192, 512, maskable 512 PNG 를 넣고 icons 를 채운다.
//       (Chrome 은 192 와 512 아이콘이 있어야 설치 가능한 앱으로 인식한다.)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5b4cf5",
    lang: "ko",
    icons: [
      // { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      // { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
