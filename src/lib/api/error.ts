// 백엔드 호출 실패를 한 가지 형태로 다룬다. status 가 0 이면 네트워크 오류나 응답 형식 오류다.
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
