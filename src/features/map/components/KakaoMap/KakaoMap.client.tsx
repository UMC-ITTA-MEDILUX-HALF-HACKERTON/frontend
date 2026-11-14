"use client";

import { useEffect, useRef, useState } from "react";

import type { KakaoMap as KakaoMapInstance } from "@features/map/types/kakao";
import { loadKakaoMaps } from "@features/map/utils/load-kakao-maps";
import { cn } from "@common/utils/cn";

export interface LatLngPoint {
  lat: number;
  lng: number;
}

interface KakaoMapProps {
  // 최초 약속 장소. 지도 중심이자 거리·100m 판정의 기준점이다.
  place: LatLngPoint;
  placeName: string;
  // 카카오 지도 확대 수준. 숫자가 작을수록 가깝다. 3 은 골목 단위.
  level?: number;
  className?: string;
}

type LoadState = "loading" | "ready" | "error";

// 장소 이름 라벨. 사용자가 입력한 문자열이라 innerHTML 대신 textContent 로 넣는다.
// 바깥 요소의 아래 여백만큼 라벨이 마커 위로 올라간다.
function createPlaceLabel(name: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "pb-11";
  const label = document.createElement("div");
  label.textContent = name;
  label.className =
    "max-w-40 truncate rounded-full bg-ink px-3 py-1 text-[11px] font-bold text-white shadow";
  wrapper.appendChild(label);
  return wrapper;
}

// S-002 모임 보드의 카카오지도. 1단계에서는 최초 약속 장소 마커만 그린다.
// 참가자 위치 마커와 GPS 상태는 다음 단계에서 이 컴포넌트에 더한다.
export function KakaoMap({ place, placeName, level = 3, className }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LoadState>("loading");
  const { lat, lng } = place;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let map: KakaoMapInstance | null = null;
    let observer: ResizeObserver | null = null;

    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled) return;
        const center = new kakao.maps.LatLng(lat, lng);
        map = new kakao.maps.Map(container, { center, level });
        new kakao.maps.Marker({ position: center, map });
        new kakao.maps.CustomOverlay({
          position: center,
          content: createPlaceLabel(placeName),
          map,
          yAnchor: 1,
          zIndex: 1,
        });

        // 화면 크기가 바뀌면(회전, 탭 전환 등) 지도를 다시 그리고 약속 장소를 가운데 둔다.
        observer = new ResizeObserver(() => {
          map?.relayout();
          map?.setCenter(center);
        });
        observer.observe(container);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error(error);
        setState("error");
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      // SDK 가 컨테이너 안에 만든 요소를 지워서 다시 마운트될 때 지도가 겹치지 않게 한다.
      container.replaceChildren();
    };
  }, [lat, lng, placeName, level]);

  return (
    <div className={cn("bg-fill relative overflow-hidden rounded-2xl", className)}>
      <div
        ref={containerRef}
        role="region"
        aria-label={`${placeName} 지도`}
        className="absolute inset-0"
      />
      {state !== "ready" ? (
        <div className="text-sub absolute inset-0 flex items-center justify-center px-4 text-center text-xs">
          {state === "loading" ? "지도를 불러오는 중이에요" : "지도를 불러오지 못했어요"}
        </div>
      ) : null}
    </div>
  );
}
