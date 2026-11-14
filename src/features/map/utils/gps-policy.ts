// POL-GPS-001 위치 판정 규칙. 화면, 브라우저 API 와 분리한 순수 함수라 경계값을 테스트로 확인한다.

export const GPS_POLICY = {
  // 최초 약속 장소에서 이 거리(m) 안이면 근처
  radiusM: 100,
  // 좌표 오차 추정치가 이 값(m) 이하여야 유효한 측정
  maxAccuracyM: 50,
  // 유효 측정이 이 횟수만큼 연속이면 GPS 를 끈다
  requiredHits: 2,
  // 서버 전송 간격
  sendIntervalMs: 10_000,
  // 새 좌표가 이 시간보다 오래 없으면 '오래된 위치'
  staleAfterMs: 60_000,
  // 측정 시각이 이보다 오래된 좌표는 쓰지 않는다 (브라우저 캐시 좌표 등). 팀 합의 전 기본값.
  maxSampleAgeMs: 30_000,
} as const;

const EARTH_RADIUS_M = 6_371_000; // 백엔드 DistanceCalculator 와 같은 값
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GpsSample extends LatLng {
  // 오차 추정치(m)
  accuracy: number;
  // 측정 시각(ms). 같은 값이면 같은 측정으로 본다.
  timestamp: number;
}

// 두 좌표 사이의 직선 거리(m). 하버사인 공식.
export function distanceM(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export interface NearbyCounter {
  // 연속으로 확인한 유효 측정 수
  hits: number;
  // 마지막으로 센 측정의 시각. 같은 측정을 두 번 세지 않으려고 둔다.
  lastTimestamp: number | null;
}

export const INITIAL_COUNTER: NearbyCounter = { hits: 0, lastTimestamp: null };

export interface SampleResult {
  counter: NearbyCounter;
  distanceM: number;
  // 100m 안, 오차 50m 이하, 오래되지 않은 측정
  valid: boolean;
  // 같은 측정이 다시 들어와 무시했다
  duplicate: boolean;
  // 연속 2회를 채워 GPS 를 꺼야 한다
  shouldStop: boolean;
  // 서버에 보내도 되는 측정인지 (아래 sendable 참고)
  sendable: boolean;
}

// 측정 하나를 판정한다. 100m 밖, 오차 초과, 오래된 측정은 연속 횟수를 0으로 되돌린다.
export function evaluateSample(
  counter: NearbyCounter,
  sample: GpsSample,
  place: LatLng,
  now: number,
): SampleResult {
  const distance = distanceM(sample, place);
  if (counter.lastTimestamp !== null && sample.timestamp === counter.lastTimestamp) {
    return {
      counter,
      distanceM: distance,
      valid: false,
      duplicate: true,
      shouldStop: false,
      sendable: false,
    };
  }
  const fresh = now - sample.timestamp <= GPS_POLICY.maxSampleAgeMs;
  const valid =
    fresh &&
    Number.isFinite(sample.accuracy) &&
    sample.accuracy <= GPS_POLICY.maxAccuracyM &&
    distance <= GPS_POLICY.radiusM;
  const next: NearbyCounter = valid
    ? { hits: counter.hits + 1, lastTimestamp: sample.timestamp }
    : { hits: 0, lastTimestamp: sample.timestamp };
  const shouldStop = next.hits >= GPS_POLICY.requiredHits;
  return {
    counter: next,
    distanceM: distance,
    valid,
    duplicate: false,
    shouldStop,
    // 현재 백엔드는 100m 안 좌표를 한 번만 받아도 '장소 근처 · GPS 꺼짐'으로 바꾼다.
    // 정책(오차 50m 이하 연속 2회)을 지키려고 100m 안 좌표는 연속 2회가 확인된 측정만 보낸다.
    // TODO(백엔드와 확인): 서버가 정책대로 판정하게 되면 100m 안 좌표도 그대로 보낸다.
    sendable: fresh && (distance > GPS_POLICY.radiusM || shouldStop),
  };
}

// 측정 실패(오류)도 연속 판정을 끊는다.
export function resetCounter(): NearbyCounter {
  return INITIAL_COUNTER;
}

// 위치 수집 시간: 약속 당일 한국 시각 00:00 부터 다음 날 00:00 전까지.
// TODO(백엔드와 확인): 주최자 모임 종료 시각이 생기면 그 시각과 다음 날 00:00 중 빠른 쪽에서 끝낸다.
export function gpsWindow(appointmentAt: string): { start: number; end: number } | null {
  const ms = new Date(appointmentAt).getTime();
  if (Number.isNaN(ms)) return null;
  const start = Math.floor((ms + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS;
  return { start, end: start + DAY_MS };
}

export function isInGpsWindow(appointmentAt: string, now: number): boolean {
  const range = gpsWindow(appointmentAt);
  return range !== null && now >= range.start && now < range.end;
}

// 서버 시각 문자열을 ms 로 읽는다. 백엔드 LocalDateTime 은 시간대가 없고 서버는 Asia/Seoul 이다.
export function parseServerTime(value: string | null | undefined): number | null {
  if (!value) return null;
  // 소수점 아래는 밀리초(3자리)까지만 쓴다.
  const trimmed = value.trim().replace(/(\.\d{3})\d+/, "$1");
  const hasZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const ms = Date.parse(hasZone ? trimmed : `${trimmed}+09:00`);
  return Number.isNaN(ms) ? null : ms;
}

export function isStale(updatedAt: number | null, now: number): boolean {
  return updatedAt === null || now - updatedAt > GPS_POLICY.staleAfterMs;
}
