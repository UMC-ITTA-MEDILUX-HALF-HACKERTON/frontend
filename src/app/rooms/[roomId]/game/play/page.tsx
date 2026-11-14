import { Suspense } from "react";

import { GamePlayView } from "@features/room/components/GamePlayView/GamePlayView.client";

export default function GamePlayPage({ params }: PageProps<"/rooms/[roomId]/game/play">) {
  return (
    <Suspense fallback={<p className="text-sub p-8 text-center text-sm">불러오는 중...</p>}>
      <Play params={params} />
    </Suspense>
  );
}

async function Play({ params }: { params: PageProps<"/rooms/[roomId]/game/play">["params"] }) {
  const { roomId } = await params;
  return <GamePlayView roomId={roomId} />;
}
