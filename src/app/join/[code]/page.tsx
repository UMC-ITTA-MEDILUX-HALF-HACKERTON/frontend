import { Suspense } from "react";

import { JoinView } from "@features/room/components/JoinView/JoinView.client";

export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  return (
    <Suspense fallback={<p className="text-sub p-8 text-center text-sm">불러오는 중...</p>}>
      <Join params={params} />
    </Suspense>
  );
}

async function Join({ params }: { params: PageProps<"/join/[code]">["params"] }) {
  const { code } = await params;
  return <JoinView code={code} />;
}
