// TODO(백엔드 DTO 확정 후): 아래 타입을 실제 필드로 좁히고 schemas/ 에 zod 스키마를 만든다.
// 지금은 경로와 메서드만 확정(API 명세서)이고 요청, 응답 필드는 아직 모른다.
export type Dto = Record<string, unknown>;

// 모임 생성 요청 (모임 이름, 약속 시간, 약속 장소 등으로 추정). 응답에 참여 코드와 주최자 memberId 가 온다.
export type CreateRoomInput = Dto;
// 입장 요청 (참여 코드 + 닉네임). 응답에 memberId 가 온다.
export type JoinRoomInput = { code: string; nickname: string } & Dto;
// GPS 위치 갱신 요청 (좌표). 응답에 직선 거리와 100m 판정 상태(예: NEARBY_GPS_OFF)가 온다.
export type UpdateLocationInput = Dto;
// 도착 확인 요청 (주최자가 실제 도착 시각을 기록, 수정).
export type ConfirmArrivalInput = Dto;
// 장소 + 활동 후보 등록 요청.
export type CreateCandidateInput = Dto;
// 투표 요청 (1인 1표, 변경 가능).
export type VoteInput = Dto;
// 최종 후보 확정 요청 (주최자만).
export type DecisionInput = Dto;
// 게임(T-Rex) 점수 제출 요청.
export type GameScoreInput = Dto;
