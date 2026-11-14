import { Suspense } from "react";

import { ShareView } from "@features/room/components/ShareView/ShareView.client";

export default function SharePage({ params }: PageProps<"/rooms/[roomId]/share">) {
  return (
    <Suspense fallback={<p className="text-sub p-8 text-center text-sm">불러오는 중...</p>}>
      <Share params={params} />
    </Suspense>
  );
}

async function Share({ params }: { params: PageProps<"/rooms/[roomId]/share">["params"] }) {
  const { roomId } = await params;
  return <ShareView roomId={roomId} />;
}
