import Image from "next/image";
import Link from "next/link";

import { APP_NAME } from "@common/constants/app";

// S-000 시작 화면
export default function Home() {
  return (
    <main className="from-primary relative flex flex-1 flex-col overflow-hidden bg-gradient-to-b to-[#8a7cf8] px-5 pt-8 pb-6 text-white">
      <span aria-hidden className="absolute top-40 -right-16 size-56 rounded-full bg-white/10" />
      <span aria-hidden className="absolute bottom-40 -left-14 size-40 rounded-full bg-white/10" />

      <div className="relative flex items-center gap-3">
        {/* 로고 마크: Figma 의 SVG (흰 둥근 사각형 46px 안에 30px) */}
        <span
          aria-hidden
          className="flex size-[46px] items-center justify-center rounded-[15px] bg-white"
        >
          <Image src="/images/logo-mark.svg" alt="" width={30} height={30} unoptimized priority />
        </span>
        <p className="text-lg font-black">{APP_NAME}</p>
      </div>

      <div className="relative mt-10">
        <h1 className="text-[28px] leading-[1.3] font-black">
          &quot;어디쯤이야?&quot;
          <br />
          이제 <span className="text-yellow">안 물어봐도</span>
          <br />
          돼요
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/85">
          친구들 위치는 지도로 보고,
          <br />
          기다리는 동안 2차는 미리 정해요.
        </p>
      </div>

      <div className="relative mt-auto mb-8 flex flex-col gap-3" aria-hidden>
        <span className="w-fit rounded-full bg-white/20 px-3.5 py-2 text-xs font-medium">
          어디쯤이야??
        </span>
        <span className="text-ink w-fit self-end rounded-full bg-white px-3.5 py-2 text-xs font-bold">
          거의 다 왔어 🏃
        </span>
        <span className="w-fit rounded-full bg-white/20 px-3.5 py-2 text-xs font-medium">
          📍 철수 · 1.2km 남음
        </span>
      </div>

      <div className="relative">
        <Link
          href="/rooms/new"
          className="text-primary flex h-[52px] w-full items-center justify-center rounded-2xl bg-white text-[15px] font-bold shadow-[0_6px_16px_rgba(22,21,31,0.2)]"
        >
          모임 만들기
        </Link>
        <p className="mt-3 text-center text-xs text-white/80">
          초대 링크를 받았다면 링크로 바로 들어오세요
        </p>
      </div>
    </main>
  );
}
