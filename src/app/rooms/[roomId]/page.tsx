import { Suspense } from "react";

import { RoomBoard } from "@features/room/components/RoomBoard/RoomBoard.client";

export default function RoomPage({ params }: PageProps<"/rooms/[roomId]">) {
  return (
    <Suspense fallback={<p className="text-sub p-8 text-center text-sm">불러오는 중...</p>}>
      <Board params={params} />
    </Suspense>
  );
}

async function Board({ params }: { params: PageProps<"/rooms/[roomId]">["params"] }) {
  const { roomId } = await params;
  return <RoomBoard roomId={roomId} />;
}
