import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";

import "@styles/globals.css";

import { Providers } from "./providers";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  preload: false,
});

const TITLE = "너빼고다옴";
const DESCRIPTION = "UMC 11th 해커톤 너빼고다옴";

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
    <html lang="ko" className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
