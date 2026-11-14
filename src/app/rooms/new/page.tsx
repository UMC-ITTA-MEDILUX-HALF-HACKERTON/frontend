import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { RoomCreateForm } from "@features/room/components/RoomCreateForm/RoomCreateForm.client";

export const metadata: Metadata = { title: "모임 만들기" };

export default function NewRoomPage() {
  return (
    <Suspense fallback={<p className="text-sub p-8 text-center text-sm">불러오는 중...</p>}>
      <Form />
    </Suspense>
  );
}

// 기본 약속 시간(지금부터 1시간 뒤)을 요청 시점에 계산해야 하므로 미리 만들어 두지 않고 요청마다 그린다.
async function Form() {
  await connection();
  return <RoomCreateForm />;
}
