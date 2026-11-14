import { Suspense } from "react";

import { GameIntroView } from "@features/room/components/GameIntroView/GameIntroView.client";

export default function GamePage({ params }: PageProps<"/rooms/[roomId]/game">) {
  return (
    <Suspense fallback={<p className="text-sub p-8 text-center text-sm">불러오는 중...</p>}>
      <Game params={params} />
    </Suspense>
  );
}

async function Game({ params }: { params: PageProps<"/rooms/[roomId]/game">["params"] }) {
  const { roomId } = await params;
  return <GameIntroView roomId={roomId} />;
}
