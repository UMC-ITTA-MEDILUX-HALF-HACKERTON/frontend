import { Suspense } from "react";

import { ConfirmVoteView } from "@features/room/components/ConfirmVoteView/ConfirmVoteView.client";

export default function ConfirmPage({ params }: PageProps<"/rooms/[roomId]/confirm">) {
  return (
    <Suspense fallback={<p className="text-sub p-8 text-center text-sm">불러오는 중...</p>}>
      <Confirm params={params} />
    </Suspense>
  );
}

async function Confirm({ params }: { params: PageProps<"/rooms/[roomId]/confirm">["params"] }) {
  const { roomId } = await params;
  return <ConfirmVoteView roomId={roomId} />;
}
