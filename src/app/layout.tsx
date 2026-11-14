import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";

import "@styles/globals.css";

import { APP_DESCRIPTION, APP_NAME } from "@common/constants/app";

import { Providers } from "./providers";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 디자인 시스템 서체 (PR #8 설정). 한글은 구글 폰트가 필요한 글자 조각만 내려준다.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  openGraph: {
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = { viewportFit: "cover", themeColor: "#5b4cf5" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-canvas min-h-full">
        <Providers>
          {/* 모바일 화면 기준(디자인 360px대). 데스크톱에서는 가운데에 폭을 제한해 보여 준다. */}
          <div className="bg-surface relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col shadow-[0_0_40px_rgba(22,21,31,0.08)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
