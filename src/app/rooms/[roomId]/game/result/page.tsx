import { Suspense } from "react";

import { GameResultView } from "@features/room/components/GameResultView/GameResultView.client";

export default function GameResultPage({ params }: PageProps<"/rooms/[roomId]/game/result">) {
  return (
    <Suspense fallback={<p className="text-sub p-8 text-center text-sm">불러오는 중...</p>}>
      <Result params={params} />
    </Suspense>
  );
}

async function Result({ params }: { params: PageProps<"/rooms/[roomId]/game/result">["params"] }) {
  const { roomId } = await params;
  return <GameResultView roomId={roomId} />;
}
