import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@common/constants/app";

// PWA 설치 정보. 이름과 설명은 common/constants/app.ts 한 곳에서 바꾼다.
// 아이콘은 Figma 로고(public/images/logo-mark.svg)를 흰 바탕에 놓은 PNG 이다.
// Chrome 은 192 와 512 아이콘이 있어야 설치 가능한 앱으로 인식한다.
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
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
