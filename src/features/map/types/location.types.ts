// 위치 공유 화면 모델.

// 백엔드 GpsStatus. SHARING 공유 중, NEARBY_GPS_OFF 장소 100m 안이라 GPS 끔, NOT_SHARING 위치 미공유.
export type ServerGpsStatus = "SHARING" | "NEARBY_GPS_OFF" | "NOT_SHARING";

// 화면에 보여 주는 참가자 위치 상태. STALE 은 1분 넘게 새 좌표가 없는 '오래된 위치'다.
export type GpsState = "SHARING" | "NEAR_OFF" | "NOT_SHARING" | "STALE";

export interface MemberLocation {
  memberId: string;
  status: ServerGpsStatus;
  distanceM: number | null;
  // 서버가 마지막으로 좌표를 받은 시각(ms)
  updatedAt: number | null;
  // 다른 참가자 마커용 좌표. 현재 백엔드 조회 응답에는 없다 (없으면 마커를 그리지 않는다).
  lat: number | null;
  lng: number | null;
}

export interface MemberGps {
  state: GpsState;
  distanceM: number | null;
  updatedAt: number | null;
  lat: number | null;
  lng: number | null;
}

// 백엔드 위치 갱신 요청 (LocationUpdateRequest)
export interface LocationUpdateBody {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

// 내 기기의 위치 수집 상태
export type TrackerState =
  // 위치 공유를 아직 켜지 않았다
  | "idle"
  // 약속 당일이 아니다
  | "outside_window"
  // 브라우저가 위치 API 를 지원하지 않거나 보안 환경(https)이 아니다
  | "unsupported"
  // 권한을 묻거나 첫 좌표를 기다리는 중
  | "starting"
  | "sharing"
  // 권한 거부 → '위치 미공유'
  | "denied"
  // 측정 실패, 전송 실패 → '갱신 중단'
  | "interrupted"
  // 장소 근처 연속 2회 확인 → GPS 꺼짐. 이 모임에서는 다시 켜지 않는다.
  | "stopped_near";
