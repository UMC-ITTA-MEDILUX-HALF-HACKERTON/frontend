import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";

// 본문 글꼴 Pretendard. 한글을 조각으로 나눠 필요한 글자만 내려받는 자체 호스팅 CSS다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@styles/globals.css";

import { Providers } from "./providers";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "너만 빼고 다 옴";
const DESCRIPTION = "UMC 11th 해커톤 너만 빼고 다 옴";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: TITLE, template: `%s | ${TITLE}` },
  description: DESCRIPTION,
  openGraph: {
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
