// 샘플 도메인. 실제 도메인이 정해지면 features/example 을 통째로 복사해 이름을 바꾸고 이 폴더는 지운다.
export interface Example {
  id: string;
  title: string;
  createdAt: string;
}

export interface CreateExampleInput {
  title: string;
}
