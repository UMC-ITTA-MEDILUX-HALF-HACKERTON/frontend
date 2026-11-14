"use client";

import { useState } from "react";

import { useIsLandscape } from "@common/hooks/useIsLandscape";
import { useGameSession } from "@features/room/hooks/useGameSession";

import { LandscapeGame } from "./LandscapeGame.client";
import { PortraitGame } from "./PortraitGame.client";
import { RotatePrompt } from "./RotatePrompt";

// 지각비 게임 플레이. 폰이 세로이면 가로로 돌려 달라고 안내하고(S-003a'), 가로이면 바로 게임이 열린다.
// 안내에서 "세로로 그냥 할래요"를 누르면 세로 화면으로 한다.
export function GamePlayView({ roomId }: { roomId: string }) {
  const session = useGameSession(roomId);
  const landscape = useIsLandscape();
  const [stayPortrait, setStayPortrait] = useState(false);

  if (!session) return <p className="text-sub p-8 text-center text-sm">불러오는 중...</p>;

  if (landscape) return <LandscapeGame session={session} onExit={session.leave} />;
  if (stayPortrait) return <PortraitGame session={session} onExit={session.leave} />;
  return <RotatePrompt onBack={session.leave} onStayPortrait={() => setStayPortrait(true)} />;
}
