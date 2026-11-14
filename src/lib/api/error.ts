// 백엔드 호출 실패를 한 가지 형태로 다룬다. status 가 0 이면 네트워크 오류나 응답 형식 오류다.
// code 는 백엔드가 error.code 로 준 값이다 (예: ROOM_NOT_FOUND). message 는 사용자에게 보여 줄 수 있는 문구다.
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code: string | null;

  constructor(message: string, status: number, body?: unknown, code?: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.code = code ?? null;
  }
}
