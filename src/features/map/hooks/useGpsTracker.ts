"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { updateMyLocation } from "@features/map/api/location.api";
import type { TrackerState } from "@features/map/types/location.types";
import {
  evaluateSample,
  GPS_POLICY,
  INITIAL_COUNTER,
  isInGpsWindow,
  resetCounter,
  type GpsSample,
  type LatLng,
} from "@features/map/utils/gps-policy";
import type { SelfGps } from "@features/map/utils/merge-locations";

// 이 기기에서 이 모임의 위치 공유를 켰는지, 100m 규칙으로 꺼졌는지 기억한다.
const consentKey = (roomId: string, memberId: string) => `gps-consent:${roomId}:${memberId}`;
const offKey = (roomId: string, memberId: string) => `gps-off:${roomId}:${memberId}`;

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // 저장하지 못하면 새로고침 뒤에 다시 묻는다. GPS 꺼짐은 서버 상태로도 지킨다.
  }
}

function geolocationAvailable(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && "geolocation" in navigator;
}

interface Options {
  roomId: string;
  meId: string | null;
  place: LatLng | null;
  appointmentAt: string;
  // 서버가 이미 '장소 근처 · GPS 꺼짐'으로 알고 있으면 다시 켜지 않는다.
  serverNearOff: boolean;
}

export interface GpsTracker {
  state: TrackerState;
  self: SelfGps | null;
  // '내 위치 공유하기' 버튼. 사용자 동작으로 권한을 묻는다.
  start: () => void;
}

// 내 기기의 GPS 를 읽어 약속 장소까지 거리를 계산하고 10초마다 서버에 보낸다 (F-002, POL-GPS-001).
// 페이지가 열려 있는 동안만 동작하고, 닫힌 페이지에서 위치를 계속 추적하지 않는다.
export function useGpsTracker({
  roomId,
  meId,
  place,
  appointmentAt,
  serverNearOff,
}: Options): GpsTracker {
  const [requested, setRequested] = useState(false);
  const [state, setState] = useState<TrackerState>("idle");
  const [fix, setFix] = useState<{ sample: GpsSample; distanceM: number } | null>(null);
  const [inWindow, setInWindow] = useState(() => isInGpsWindow(appointmentAt, Date.now()));

  const counter = useRef(INITIAL_COUNTER);
  const pending = useRef<GpsSample | null>(null);
  const lastSentAt = useRef(0);
  const sending = useRef(false);

  const lat = place?.lat ?? null;
  const lng = place?.lng ?? null;

  // 이미 꺼졌거나, 전에 공유를 켰던 모임이면 그대로 이어 간다 (이 기기의 기록).
  const offSaved = useMemo(() => (meId ? readFlag(offKey(roomId, meId)) : false), [roomId, meId]);
  const consentSaved = useMemo(
    () => (meId ? readFlag(consentKey(roomId, meId)) : false),
    [roomId, meId],
  );
  const supported = useMemo(() => geolocationAvailable(), []);
  const wanted = requested || consentSaved;

  // 당일 00:00 과 다음 날 00:00 경계를 넘는지 1분마다 확인한다.
  useEffect(() => {
    const check = () => setInWindow(isInGpsWindow(appointmentAt, Date.now()));
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [appointmentAt]);

  const send = useCallback(
    async (sample: GpsSample) => {
      if (!meId || sending.current) return;
      sending.current = true;
      lastSentAt.current = Date.now();
      try {
        await updateMyLocation(roomId, meId, {
          latitude: sample.lat,
          longitude: sample.lng,
          accuracyMeters: sample.accuracy,
        });
      } catch (error) {
        console.error(error);
        setState((prev) => (prev === "sharing" ? "interrupted" : prev));
      } finally {
        sending.current = false;
      }
    },
    [roomId, meId],
  );

  // 위치 감시. 공유를 켰고, 당일이고, 아직 꺼지지 않았을 때만 돈다.
  const stopped = state === "stopped_near" || offSaved || serverNearOff;
  const active = wanted && supported && inWindow && lat !== null && lng !== null && meId !== null;

  useEffect(() => {
    if (!active || stopped || lat === null || lng === null || !meId) return;
    if (!geolocationAvailable()) return;
    const target = { lat, lng };
    let done = false;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (done) return;
        const sample: GpsSample = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        const result = evaluateSample(counter.current, sample, target, Date.now());
        if (result.duplicate) return;
        counter.current = result.counter;
        setFix({ sample, distanceM: result.distanceM });

        if (result.shouldStop) {
          // 연속 2회 확인: 마지막 좌표를 바로 보내고 GPS 를 끈다. 이 모임에서는 다시 켜지 않는다.
          done = true;
          navigator.geolocation.clearWatch(watchId);
          pending.current = null;
          writeFlag(offKey(roomId, meId));
          setState("stopped_near");
          void send(sample);
          return;
        }
        setState("sharing");
        pending.current = result.sendable ? sample : null;
        // 첫 좌표는 기다리지 않고 바로 보낸다.
        if (result.sendable && Date.now() - lastSentAt.current >= GPS_POLICY.sendIntervalMs) {
          void send(sample);
        }
      },
      (error) => {
        if (done) return;
        counter.current = resetCounter();
        if (error.code === error.PERMISSION_DENIED) {
          done = true;
          navigator.geolocation.clearWatch(watchId);
          setState("denied");
        } else {
          setState("interrupted");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    );

    // 10초마다 가장 최근 좌표를 보낸다. 오래된 좌표는 보내지 않아 서버가 '오래된 위치'로 판단하게 둔다.
    const tick = window.setInterval(() => {
      const sample = pending.current;
      if (!sample || Date.now() - sample.timestamp > GPS_POLICY.maxSampleAgeMs) return;
      if (Date.now() - lastSentAt.current < GPS_POLICY.sendIntervalMs) return;
      void send(sample);
    }, 1_000);

    return () => {
      done = true;
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(tick);
    };
  }, [active, stopped, lat, lng, meId, roomId, send]);

  const start = useCallback(() => {
    if (!meId) return;
    if (!geolocationAvailable()) {
      setState("unsupported");
      return;
    }
    writeFlag(consentKey(roomId, meId));
    setState("starting");
    setRequested(true);
  }, [roomId, meId]);

  let shown: TrackerState = state;
  if (stopped) shown = "stopped_near";
  else if (!supported) shown = "unsupported";
  else if (state !== "denied") {
    if (!inWindow) shown = "outside_window";
    else if (!wanted) shown = "idle";
    else if (state === "idle") shown = "starting";
  }

  // 서버가 이미 GPS 꺼짐으로 알고 있으면 이 기기에도 기록해 다시 켜지 않는다.
  useEffect(() => {
    if (meId && serverNearOff) writeFlag(offKey(roomId, meId));
  }, [roomId, meId, serverNearOff]);

  const self: SelfGps | null = meId
    ? {
        memberId: meId,
        tracker: shown,
        distanceM: fix?.distanceM ?? null,
        lat: fix?.sample.lat ?? null,
        lng: fix?.sample.lng ?? null,
        fixedAt: fix?.sample.timestamp ?? null,
      }
    : null;

  return { state: shown, self, start };
}
