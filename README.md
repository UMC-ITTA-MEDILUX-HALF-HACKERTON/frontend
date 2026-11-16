# 너만 빼고 다 옴 (Frontend)

UMC 11th 해커톤 "너만 빼고 다 옴" 웹 프론트엔드입니다. 모임을 만들고, 친구들이 도착하는 걸 확인하고, 지각한 사람에게 지각비 게임을 거는 서비스입니다.

> 해커톤이 끝나 운영 서버와 배포를 내렸습니다. `.env.local` 에 `NEXT_PUBLIC_USE_MOCK=true` 를 두고 `pnpm dev` 로 실행하면 서버 없이 mock 데이터로 둘러볼 수 있습니다. 지도는 카카오 키가 있어야 보입니다.

## 링크

| 구분                      | 주소                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Frontend 저장소           | https://github.com/UMC-ITTA-MEDILUX-HALF-HACKERTON/frontend                        |
| Backend 저장소            | https://github.com/UMC-ITTA-MEDILUX-HALF-HACKERTON/backend                         |
| Deploy 저장소 (서버 구성) | https://github.com/UMC-ITTA-MEDILUX-HALF-HACKERTON/deploy                          |
| 기획, 디자인 문서         | https://github.com/UMC-ITTA-MEDILUX-HALF-HACKERTON/MEDILUX-ITTA-UMC-Half-Hackathon |

## 기술 스택

- Next.js 16 (App Router), React 19, TypeScript
- TanStack Query, Zustand, zod
- Tailwind CSS 4
- 테스트: Vitest, 품질: ESLint, Prettier

## 시작하기

```bash
pnpm install
cp .env.example .env.local   # 값을 채운다 (아래 환경변수 참고)
pnpm dev                     # http://localhost:3000
```

| 명령                             | 설명                     |
| -------------------------------- | ------------------------ |
| `pnpm dev`                       | 개발 서버                |
| `pnpm build`, `pnpm start`       | 프로덕션 빌드와 실행     |
| `pnpm lint`, `pnpm format:check` | 린트, 포맷 검사          |
| `pnpm typecheck`                 | 타입 검사                |
| `pnpm test`                      | 테스트                   |
| `pnpm verify`                    | 위 검사와 빌드를 한 번에 |

## 환경변수

값은 `.env.local` 에만 두고 git 에 올리지 않습니다. 이름과 설명은 [`.env.example`](./.env.example) 에 있습니다.

| 이름                           | 설명                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`     | 백엔드 API 주소. 운영은 `https://api.allbutyou.devnoco.com`, 로컬 백엔드는 `http://localhost:8080` |
| `NEXT_PUBLIC_USE_MOCK`         | `true` 이면 백엔드 없이 mock 데이터로 동작. 백엔드 연동 확인 때는 지우거나 `false`                 |
| `NEXT_PUBLIC_SITE_URL`         | 사이트 주소 (메타데이터). 운영은 `https://allbutyou.devnoco.com`                                   |
| `NEXT_PUBLIC_KAKAO_MAP_KEY`    | 카카오지도 JavaScript 키. 브라우저에 노출되며 카카오 앱의 Web 플랫폼에 도메인을 등록해야 함        |
| `NEXT_KAKAO_MAP_KEY`           | 장소 검색용 카카오 REST API 키. 서버(`/api/places`)에서만 읽음                                     |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 웹 푸시 공개키                                                                                     |

## 백엔드 연동 현황

화면은 아직 mock 으로 동작하고(`NEXT_PUBLIC_USE_MOCK=true`), 연결된 API 부터 하나씩 실제 서버로 바꾸고 있습니다.

| 기능                             | 상태                      |
| -------------------------------- | ------------------------- |
| 모임 생성, 참여, 조회            | 연결됨                    |
| 도착 확인 (취소는 백엔드 미지원) | 연결됨                    |
| 장소 검색 (카카오)               | 연결됨                    |
| 후보 등록, 투표, 확정            | 예정 (백엔드는 poll 구조) |
| 지각비 게임                      | 예정                      |
| 위치 갱신                        | 백엔드 API 없음           |

## 폴더 구조

```
src/
├─ app/        라우트 (rooms, join, api/places)
├─ common/     공통 컴포넌트, 상수, 유틸
├─ features/   기능별 코드 (room, map, minigame, push ...)
├─ lib/        API 클라이언트, 참가자 토큰
└─ styles/     디자인 토큰
```

기능 폴더는 `api`, `components`, `mutations`, `queries`, `schemas`, `types` 로 나눕니다. 백엔드 DTO 와 화면 모델의 변환은 `features/room/api/room.mapper.ts` 에 있습니다.

## 배포

해커톤 종료 후 운영 서버(AWS)와 Vercel 배포를 모두 내렸습니다. 서버가 없으므로 `NEXT_PUBLIC_USE_MOCK=true` 로 실행합니다.

## 협업 규칙

이슈, 브랜치, 커밋, PR 규칙은 [`.github/WORKFLOW.md`](./.github/WORKFLOW.md) 를 따릅니다.
