import type { MetadataRoute } from "next";

// PWA 설치 정보.
// TODO: 팀 이름이 정해지면 name, short_name, description 과 아래 색을 바꾼다.
// TODO: 아이콘이 정해지면 public/icons/ 에 192, 512, maskable 512 PNG 를 넣고 icons 를 채운다.
//       (Chrome 은 192 와 512 아이콘이 있어야 설치 가능한 앱으로 인식한다.)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "너만 빼고 다 옴",
    short_name: "너만 빼고 다 옴",
    description: "UMC 11th 해커톤 너만 빼고 다 옴",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ko",
    icons: [
      // { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      // { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
