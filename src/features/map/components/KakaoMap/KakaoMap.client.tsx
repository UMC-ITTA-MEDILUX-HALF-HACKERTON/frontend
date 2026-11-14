"use client";

import { useEffect, useRef, useState } from "react";

import type {
  KakaoCustomOverlay,
  KakaoMap as KakaoMapInstance,
  KakaoNamespace,
} from "@features/map/types/kakao";
import { loadKakaoMaps } from "@features/map/utils/load-kakao-maps";
import { cn } from "@common/utils/cn";

export interface LatLngPoint {
  lat: number;
  lng: number;
}

// 참가자 위치 마커. me 는 내 위치, stale 은 1분 넘게 갱신이 없는 '오래된 위치'다.
export interface MapMarker extends LatLngPoint {
  id: string;
  label: string;
  tone: "me" | "member" | "stale";
}

interface KakaoMapProps {
  // 최초 약속 장소. 지도 중심이자 거리·100m 판정의 기준점이다.
  place: LatLngPoint;
  placeName: string;
  markers?: MapMarker[];
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

const TONE_CLASS: Record<MapMarker["tone"], string> = {
  me: "bg-primary text-white",
  member: "bg-white text-ink",
  stale: "bg-fill text-sub opacity-70",
};

// 참가자 마커: 점과 닉네임. 닉네임도 사용자 입력이라 textContent 로 넣는다.
function createMemberMarker(marker: MapMarker): HTMLElement {
  const el = document.createElement("div");
  el.className = cn(
    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shadow",
    TONE_CLASS[marker.tone],
  );
  const dot = document.createElement("span");
  dot.className = cn(
    "size-2 rounded-full",
    marker.tone === "me" ? "bg-white" : marker.tone === "stale" ? "bg-sub" : "bg-primary",
  );
  const name = document.createElement("span");
  name.className = "max-w-20 truncate";
  name.textContent = marker.tone === "stale" ? `${marker.label} · 오래된 위치` : marker.label;
  el.append(dot, name);
  return el;
}

// S-002 모임 보드의 카카오지도. 최초 약속 장소와 참가자 위치를 그린다.
// 지도는 약속 장소가 바뀔 때만 새로 만들고, 마커는 같은 지도 위에서 바꾼다.
export function KakaoMap({ place, placeName, markers, level = 3, className }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ kakao: KakaoNamespace; map: KakaoMapInstance } | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  // 화면을 맞춘 마커 구성. 같은 사람들이 움직일 때는 사용자가 옮긴 화면을 건드리지 않는다.
  const fittedFor = useRef<string | null>(null);
  const { lat, lng } = place;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;

    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled) return;
        const center = new kakao.maps.LatLng(lat, lng);
        const map = new kakao.maps.Map(container, { center, level });
        new kakao.maps.Marker({ position: center, map });
        new kakao.maps.CustomOverlay({
          position: center,
          content: createPlaceLabel(placeName),
          map,
          yAnchor: 1,
          zIndex: 1,
        });
        mapRef.current = { kakao, map };

        // 화면 크기가 바뀌면(회전, 탭 전환 등) 지도를 다시 그린다.
        observer = new ResizeObserver(() => map.relayout());
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
      mapRef.current = null;
      fittedFor.current = null;
      setState("loading");
      // SDK 가 컨테이너 안에 만든 요소를 지워서 다시 마운트될 때 지도가 겹치지 않게 한다.
      container.replaceChildren();
    };
  }, [lat, lng, placeName, level]);

  // 마커 목록이 바뀌면 다시 그린다. 참가자 구성이 바뀔 때만 약속 장소와 마커가 모두 보이게 화면을 맞춘다.
  const markerKey = JSON.stringify(markers ?? []);
  const idsKey = (markers ?? []).map((m) => m.id).join(",");

  useEffect(() => {
    const current = mapRef.current;
    if (state !== "ready" || !current) return;
    const { kakao, map } = current;
    const list = JSON.parse(markerKey) as MapMarker[];

    const overlays: KakaoCustomOverlay[] = list.map(
      (marker) =>
        new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(marker.lat, marker.lng),
          content: createMemberMarker(marker),
          map,
          yAnchor: 0.5,
          zIndex: marker.tone === "me" ? 3 : 2,
        }),
    );

    if (list.length > 0 && fittedFor.current !== idsKey) {
      fittedFor.current = idsKey;
      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(new kakao.maps.LatLng(lat, lng));
      for (const marker of list) bounds.extend(new kakao.maps.LatLng(marker.lat, marker.lng));
      map.setBounds(bounds, 40, 40, 40, 40);
    }

    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [state, markerKey, idsKey, lat, lng]);

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
