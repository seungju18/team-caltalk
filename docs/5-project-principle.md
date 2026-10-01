# team-caltalk 프로젝트 구조 설계 원칙 (초안)

## 문서 변경 이력

> 변경 시 표 맨 아래에 한 줄씩 누적 기록한다. 기존 행은 수정하지 않는다.

| 버전 | 변경자    | 변경내용                                                                                                                                                                                               | 변경일시         |
| ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 0.1  | seungju18 | 프로젝트 구조 설계 원칙 초안 작성                                                                                                                                                                      | 2026-09-30       |
| 0.2  | seungju18 | HTTP 클라이언트를 axios로 변경 (2.2, 6.2), 기준 PRD v0.7                                                                                                                                               | 2026-09-30       |
| 0.3  | seungju18 | `screens/` → `pages/`, `*Screen.tsx` → `*Page.tsx`, uiStore 페이지 초기값 login (2.2, 6.2)                                                                                                             | 2026-09-30       |
| 0.4  | seungju18 | `api/queryClient.ts` 추가 (6.2)                                                                                                                                                                        | 2026-09-30       |
| 0.5  | seungju18 | HTTP 메서드별 `useQuery`/`useMutation` 사용 규칙 추가 (3.3)                                                                                                                                            | 2026-09-30       |
| 0.6  | seungju18 | `useQuery`/`useMutation` 결과·훅 반환값 명칭 규칙 추가 (3.3)                                                                                                                                           | 2026-09-30       |
| 0.7  | seungju18 | 문서 정합성 점검: 기준 문서 버전 갱신, 완료 여부 이름을 ERD와 같은 `isCompleted`(`is_completed`)로 변경(3.1), 인증 전 경로에 헬스체크 추가(5.2), docs 범위 1~7번(6.1), 화면 목록 불일치 해소(6.2, 7장) | 2026-09-30 14:47 |
| 0.8  | seungju18 | 8번 문서 8장 결정 반영: 자동화 테스트 미도입(4장 10), 백엔드 TS 실행 방식(6.3), 7장의 자동화 테스트·TS 실행·KPI-04 항목 해소, 기준 PRD v0.10                                                           | 2026-09-30 15:06 |
| 0.9  | seungju18 | 5.2 인증 전 경로에 개발 전용 API 문서(`/api-docs`) 예외 추가                                                                                                                                           | 2026-10-01       |
| 1.0  | seungju18 | 선택 환경 변수 `CORS_ORIGIN`으로 CORS 허용 출처 설정 추가 (5.1, 5.3)                                                                                                                                   | 2026-10-01       |
| 1.1  | seungju18 | 백엔드 자동화 테스트(`node:test`) 반영(4장 10), 6.1 docs 범위 1~8번, 6.3 디렉토리 구조를 실제 파일에 맞춤, 기준 PRD v0.11, 시나리오 v0.4, 와이어프레임 v0.3                                           | 2026-10-01       |

> 기준 문서: `CLAUDE.md`, `docs/1-domain-definition.md` v0.7 (이하 "도메인 정의서"), `docs/2-PRD.md` v0.11 (이하 "PRD"), `docs/3-user-scenario.md` v0.4 (이하 "시나리오"), `docs/4-wireframes.md` v0.3 (이하 "와이어프레임"). 기술 스택·프론트엔드 코드 규칙·인증 토큰·NFR·일정은 PRD, 규칙(BR)·수용 기준(AC)·미결정(OI)은 도메인 정의서를 원본으로 하고 이 문서에서는 ID로만 참조한다. `(가정)` 표시는 위 문서에 근거가 없어 이 문서에서 정한 내용이다.

## 0. 이 문서의 범위

- 코드를 어디에 두고, 무엇이 무엇을 import할 수 있는지를 정한다. 기능·규칙은 다시 정의하지 않는다.
- MVP·2일 1인 개발 규모(PRD 8장)에 맞춘 최소 구조다. 원칙은 "지키는지 확인할 수 있는" 문장으로만 쓴다.

## 1. 모든 스택에 공통인 최상위 원칙

1. **도메인 정의서가 원본이다.** 코드는 규칙을 재정의하지 않고 BR/AC를 구현한다. 규칙을 구현한 코드에는 근거 ID를 주석으로 남긴다 (예: `// BR-08`).
2. **서버가 기준이다.** 입력 검증, 소유권, 상태 판정(BR-10), 월 포함 판정(BR-12)은 서버 결과가 기준이고, 화면 검증은 UX 보조다 (PRD 5.1).
3. **지정 스택만 쓴다.** PRD 7.1·7.2에 없는 라이브러리·도구는 추가하지 않는다. 필요하면 PRD 7.2를 먼저 고치고 사용자 확인을 받는다. ORM은 금지다 (PRD 7.1).
4. **오버엔지니어링 금지 (CLAUDE.md).** 구현체가 하나뿐인 인터페이스, 한 곳에서만 쓰는 추상화, 쓰지 않는 설정 옵션을 만들지 않는다.
5. **중복 추출은 세 번째부터.** 같은 코드가 3곳 이상에서 반복될 때만 공통 함수·컴포넌트로 뺀다 (가정).
6. **P0가 먼저다.** 일정이 밀리면 PRD 8장의 절단 순서를 따르고 P0는 자르지 않는다.
7. **요청받은 범위만 바꾼다.** 관련 없는 코드는 고치지 않고 언급만 한다 (CLAUDE.md 외과적 변경). 문서를 고치면 그 문서의 "문서 변경 이력"에 한 줄 추가한다.
8. **TypeScript로 통일한다.** 프론트·백 모두 TS(PRD 7.1)이며 `any`는 쓰지 않는다 (가정).
9. **범위 외 기능의 자리를 미리 만들지 않는다.** 도메인 정의서 6.1, PRD 4.2 항목(라우터, i18n, 다크 모드, 회원 탈퇴 등)을 위한 디렉토리·훅·설정은 두지 않는다.

## 2. 의존성 / 레이어 원칙

### 2.1 공통

- 의존 방향은 한쪽으로만 흐르고 순환하지 않는다.
- 프론트엔드와 백엔드는 서로의 코드를 import하지 않는다. 공유 패키지도 만들지 않는다 (가정). API 요청·응답 타입은 프론트엔드 `api/`에서 따로 정의한다 (가정).
- 서버 데이터의 진실은 DB다. 최후의 방어선은 DB 제약이다 (PRD 7.3).

### 2.2 프론트엔드

```
pages → components → hooks → api / stores → lib
```

| 원칙                                                                                                                                                             | 확인 방법                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 오른쪽 계층은 왼쪽 계층을 import하지 않는다                                                                                                                      | `api/`, `stores/`, `lib/`에서 `hooks/`·`components/`·`pages/` import가 없다 |
| `components/`·`pages/`는 렌더링(JSX)만 한다. `useQuery`, `useMutation`, axios·`fetch`, Zustand store를 직접 호출하지 않고 `hooks/`를 거친다 (PRD 7.4)            | 두 디렉토리에서 위 호출을 검색하면 0건이다                                  |
| `api/`는 React에 의존하지 않는 순수 함수다 (가정). axios는 `api/`에서만 import한다 (PRD 7.1)                                                                     | `api/`에 `react` import가 없고, `api/` 밖에 `axios` import가 없다           |
| 서버 데이터(할일·카테고리·사용자)는 TanStack Query, UI 상태(화면, 탭, 필터, 캘린더 월, 로그인 여부)는 Zustand. 서버 데이터를 Zustand에 복사하지 않는다 (PRD 7.1) | store에 할일·카테고리 목록 필드가 없다                                      |
| Access Token은 Zustand 메모리에만 둔다. `localStorage`·`sessionStorage` 사용 금지 (PRD 6.4)                                                                      | 두 API 사용처가 0건이다                                                     |
| 401 처리(재발급 1회, 동시 요청은 재발급 1개 공유, 실패 시 상태·캐시 초기화)는 API 호출 경로 한 곳에만 둔다 (PRD 6.4)                                             | 재발급 호출 코드가 한 파일에만 있다                                         |
| 화면 전환은 라우터 없이 Zustand 화면 상태로 한다 (PRD 7.2)                                                                                                       | `react-router` 류 의존성이 없다                                             |
| 등록·수정·삭제 성공 시 TanStack Query 캐시를 무효화해 목록·캘린더를 함께 갱신한다 (PRD 7.1, FR-12)                                                               | 뮤테이션 훅이 목록·캘린더 쿼리 키를 모두 무효화한다                         |

### 2.3 백엔드

```
routes → services → db
middleware, validators, errors 는 어느 계층에서나 사용 (역방향 의존 금지)
```

| 원칙                                                                                                                   | 확인 방법                                                                  |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `routes/`는 HTTP만 다룬다: 요청 파싱, validator 호출, service 호출, 응답                                               | `routes/`에 SQL 문자열이 없다                                              |
| `services/`가 비즈니스 규칙과 SQL(pg)을 함께 가진다. Repository 계층은 만들지 않는다 (가정, 규모상 불필요)             | `services/` 밖에 SQL이 없다                                                |
| `services/`는 Express 타입(`Request`, `Response`)을 import하지 않는다 (가정)                                           | `services/`에 `express` import가 없다                                      |
| 모든 할일·카테고리 쿼리는 소유자 조건을 포함한다. 사용자 ID는 Access Token의 `sub`에서만 얻는다 (NFR-09, BR-03, BR-13) | 요청 본문·쿼리스트링의 사용자 ID를 쓰는 코드가 없다. 소유권 불일치는 404다 |
| 여러 쓰기가 한 덩어리인 작업은 하나의 트랜잭션이다: 회원가입(BR-05), 카테고리 삭제(BR-18), Refresh 회전 (PRD 7.3, 6.4) | 해당 service 함수가 `db.ts`의 트랜잭션 헬퍼를 쓴다                         |
| 목록·캘린더 필터링, 상태 판정, 월 판정은 SQL에서 한다. 전체 조회 후 앱에서 거르지 않는다 (NFR-04, PRD 7.3)             | service에 필터용 `Array.filter`가 없다                                     |
| DB 접근은 `db.ts`의 pg 풀 하나로만 한다 (NFR-05)                                                                       | `new Pool` 호출이 한 곳이다                                                |

## 3. 코드 / 네이밍 원칙

### 3.1 용어와 이름

- 도메인 용어는 도메인 정의서 2장 용어집을 따른다. 화면 문구에서 "시작일", "종료일" 같은 약칭을 쓰지 않는다 (도메인 정의서 2장).
- 코드 식별자는 영어 camelCase, 타입·컴포넌트는 PascalCase, DB 테이블·컬럼은 snake_case (PRD 2.2의 `users.created_at`, PRD 6.4의 `refresh_tokens`와 일치)다. API JSON 필드는 camelCase다 (가정).
- 용어 대응 (가정): 시작일자 `startDate`(`start_date`), 종료일자 `endDate`(`end_date`), 카테고리 `category`, 할일 `todo`, 완료 여부 `isCompleted`(`is_completed`, ERD 2.3).
- 할일 상태 값은 한 곳에서 정의하고 그 값만 쓴다: `not_started` / `in_progress` / `done` / `overdue` (가정, BR-10의 시작 전 / 진행 중 / 완료 / 지연). 상태는 저장하지 않고 조회 시 도출한다 (BR-10).

### 3.2 파일 이름

| 대상                 | 규칙                                          |
| -------------------- | --------------------------------------------- |
| React 컴포넌트       | `PascalCase.tsx`, 파일당 컴포넌트 1개 (가정)  |
| 커스텀 훅            | `useXxx.ts` (PRD 7.4의 훅 목록 이름을 따른다) |
| 그 외 프론트·백 파일 | `camelCase.ts` (가정)                         |

### 3.3 프론트엔드 코드 규칙

PRD 7.4를 그대로 따른다. 여기서는 위치와 검증 방법만 정한다.

| 규칙 (PRD 7.4)                                                                                                                                            | 확인 방법                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 스타일은 JSX `className`의 Tailwind 유틸리티 직접 적용만 사용한다                                                                                         | `.css` 파일은 `src/index.css` 하나뿐이고 `main.tsx`에서만 import한다                    |
| CSS Modules, CSS-in-JS, `@apply` 금지. `style={{}}`은 런타임 계산 값(캘린더 막대 위치 등)에만 허용                                                        | 위 패턴 검색 결과가 예외 사유가 있는 곳뿐이다                                           |
| 반복 클래스 묶음은 CSS가 아니라 작은 컴포넌트(`Button`, `Input`, `Badge` 등)로 추출한다                                                                   | -                                                                                       |
| 조건부 클래스는 템플릿 리터럴로 조합한다. `clsx` 등 추가하지 않는다                                                                                       | `package.json`에 `clsx` 류가 없다                                                       |
| 반응형은 `md:`, `lg:` 접두사만, 모바일 우선 (NFR-12)                                                                                                      | 임의 미디어 쿼리 없음                                                                   |
| 컴포넌트 파일은 100줄 이하를 목표로 한다. 넘으면 하위 컴포넌트나 훅으로 나눈다 (PRD 7.4, 가정)                                                            | -                                                                                       |
| 이벤트 핸들러가 2줄을 넘으면 훅으로 옮긴다                                                                                                                | -                                                                                       |
| `dangerouslySetInnerHTML` 금지 (R-08)                                                                                                                     | 사용처 0건                                                                              |
| 서버 호출은 GET이면 `useQuery`, POST·PUT·PATCH·DELETE면 `useMutation`으로만 한다                                                                          | `useQuery`의 `queryFn`은 GET만, `useMutation`의 `mutationFn`은 GET 외 메서드만 호출한다 |
| `useQuery` 결과는 구조분해하고 도메인 명사로 이름을 바꾼다: `data: todos`, `isLoading: isTodosLoading`. `todosData`처럼 `Data`를 붙이지 않는다 (가정)     | `data: xxxData` 형태가 없다                                                             |
| `useMutation` 결과는 구조분해하지 않고 `{동작}Mutation` 객체로 받는다: `loginMutation`, `createCategoryMutation`. 응답 처리는 `onSuccess`에서 한다 (가정) | `useMutation` 반환값 구조분해가 없다                                                    |
| 훅은 풀어서 반환한다: 실행 함수 `{동작}`(`login`), 진행 상태 `is{동작}ing`(`isLoggingIn`), 오류 `{동작}Error`(`loginError`) (가정)                        | 훅 반환값에 `Mutation` 객체가 없다                                                      |
| 날짜 선택은 `<input type="date">`를 쓰고 date picker 라이브러리를 쓰지 않는다 (PRD 5.1)                                                                   | -                                                                                       |

### 3.4 백엔드 코드 규칙

| 원칙                                                                                                                                                           | 근거 / 확인 방법                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| SQL은 `$1, $2 ...` 파라미터 바인딩만 쓴다. 정렬·필터 값은 서버 허용 목록에서 매핑한다                                                                          | NFR-08. 문자열 연결로 만든 SQL이 없다                              |
| 날짜는 `YYYY-MM-DD` 문자열로만 주고받고, pg 타입 파서(OID 1082)를 문자열로 설정한다                                                                            | PRD 7.3, R-05                                                      |
| '오늘'은 서버 시계가 아니라 요청에 포함된 사용자 로컬 날짜를 쓴다. 서버는 형식만 검증한다                                                                      | OI-05, PRD 9장. service에 `new Date()`로 오늘을 구하는 코드가 없다 |
| 비밀번호 해시는 비동기 `bcrypt.hash`/`compare`만 쓴다                                                                                                          | R-04                                                               |
| 오류는 `errors.ts`의 오류 클래스로 던지고 최종 오류 핸들러 한 곳에서 응답으로 바꾼다. 검증 실패는 400 + 항목별 사유, 인증 실패는 401, 소유권 불일치·없음은 404 | NFR-10, NFR-09, BR-11, BR-14                                       |
| 검증은 수동 검증 함수로 하고 검증 라이브러리를 추가하지 않는다. 제약 수치는 도메인 정의서 3장 값을 `validators/`에서만 정의한다                                | PRD 7.2                                                            |
| 로그인 실패 응답은 식별자 존재 여부를 구분하지 않는다                                                                                                          | BR-14                                                              |

## 4. 테스트 / 품질 원칙

1. **수용 기준이 곧 테스트 케이스다.** AC-05 ~ AC-10 전 항목을 체크리스트로 만들어 Day 2 종료 시점에 100% 통과시킨다 (KPI-01, R-02). 시나리오(SC-01 ~ SC-13)를 화면 확인 순서로 쓴다.
2. **서버 규칙은 API 응답으로 먼저 확인한다.** Day 1 종료 시 AC-05~AC-09의 서버 측 판정(저장 거부, 404, 필터 결과, 월 포함 결과)을 확인한다 (PRD 8장). 확인용 요청 모음은 `backend/requests/`에 둔다 (가정).
3. **AC 예시 데이터를 재사용한다.** 도메인 정의서 5.2의 할일 A~F(오늘 = 2026-10-01)를 개발용 시드로 쓴다 (가정). 이 데이터로 AC-08-7(오늘 = 2026-10-02), AC-09를 포함한 날짜 경계를 확인한다 (R-05).
4. **소유권 차단은 항상 확인한다.** AC-06-4, AC-07-3, AC-08-8, 그리고 다른 사용자의 카테고리 지정(BR-13)은 매번 확인 항목에 포함한다.
5. **규칙은 DB 제약이 한 번 더 막는다.** 이메일 UNIQUE, (소유자, 카테고리 이름) UNIQUE, `CHECK (종료일자 >= 시작일자)`, 기본 카테고리 부분 UNIQUE 인덱스 (PRD 7.3, R-02). 서버 검증을 우회해도 잘못된 데이터가 저장되지 않아야 한다.
6. **부하 테스트는 k6로 NFR-03 시나리오를 실행한다.** 결과 리포트에 실행 환경 사양을 함께 기록한다 (KPI-02, R-06). 사전 데이터 생성 스크립트는 `loadtest/`에 둔다 (가정).
7. **화면 확인은 375px / 768px / 1280px 세 폭으로 한다** (PRD 8장 Day 2 오후, NFR-12·13). 지원 브라우저는 NFR-14를 따른다.
8. **접근성 테스트는 하지 않는다** (NFR-15 범위 외).
9. **타입 오류 0건을 유지한다.** 프론트·백 모두 `tsc --noEmit`이 통과해야 한다 (가정).
10. **백엔드 자동화 테스트는 Node 내장 `node:test`로 하고 테스트 프레임워크 의존성은 추가하지 않는다.** `backend/test/*.test.ts`를 `npm test`(`--experimental-test-coverage`, `--test-concurrency=1`)로 실행하며, 각 테스트는 `db/seed.sql`로 개발 DB를 초기화한다. `backend/requests/` 요청 모음은 수동 확인용으로 유지하고, 화면은 AC 체크리스트로 확인한다 (8번 문서 8장, BE-11, IT-01).

## 5. 설정 / 보안 / 운영 원칙

### 5.1 설정

- 비밀 값과 환경별 값은 환경 변수로만 주입하고 코드·저장소에 넣지 않는다. 서명 키는 `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` 두 개이며 서로 다른 값이다 (PRD 6.4).
- 그 외 환경 변수는 `DATABASE_URL`, `PORT`, `NODE_ENV`(운영에서 쿠키 `Secure`)로 한다 (가정). 선택 환경 변수 `CORS_ORIGIN`(쉼표 구분 허용 출처)을 두며, 비우면 CORS 헤더를 보내지 않는다.
- 환경 변수 읽기와 필수 값 검증은 `backend/src/config.ts` 한 곳에서만 한다. 필수 값이 없으면 서버는 시작하지 않는다 (가정).
- `.env`는 Git에 올리지 않고 `.env.example`(값 없는 목록)만 올린다 (가정).
- 튜닝 값(bcrypt cost 10, 풀 최대 20, 본문 100KB, 토큰 만료 15분/7일)은 PRD 값을 `config.ts`에 상수로 둔다 (NFR-05, NFR-07, NFR-10, PRD 6.4).

### 5.2 보안

| 원칙                                                                                                                                                                         | 근거                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 인증 방식·토큰 사양·회전·재사용 감지·CSRF 대응은 PRD 6.4를 그대로 구현한다. 구조상 위치: 토큰 발급·검증·회전은 `services/authService.ts`, Access 검증은 `middleware/auth.ts` | NFR-06, FR-03, FR-04 |
| Access 검증은 알고리즘 `HS256` 고정, `type = "access"` 확인                                                                                                                  | PRD 6.4              |
| Refresh Token 원문은 DB에 저장하지 않는다. `jti`만 저장한다                                                                                                                  | PRD 6.4              |
| Refresh 쿠키 경로는 `/api/auth/refresh`, `/api/auth/logout`에만 전송되도록 `Path=/api/auth`로 둔다. 쿠키 읽기는 `cookie-parser`                                              | PRD 6.4, 7.2         |
| 비밀번호·토큰·`Authorization` 헤더 값은 로그에 남기지 않는다                                                                                                                 | (가정)               |
| 로그인 남용 방지(P1)는 메모리 카운터로 단순 구현하며 `middleware/loginLimit.ts`에 둔다                                                                                       | NFR-11               |
| 인증 필요한 라우터는 `middleware/auth.ts`를 라우터 단위로 일괄 적용한다. 인증 전 경로는 회원가입·로그인·재발급·로그아웃·헬스체크뿐이다. 예외: 개발 환경 전용 API 문서 `/api-docs` | BR-01, UC-01·UC-02   |

### 5.3 운영

- **배포:** 단일 서버에서 Express가 `frontend/dist`를 정적 서빙하고 `/api`를 처리한다. 같은 출처이므로 운영에서는 `CORS_ORIGIN`을 비워 CORS를 쓰지 않는다 (PRD 7.2). 개발 등 다른 출처에서 직접 호출할 때만 `CORS_ORIGIN`에 출처를 넣는다 (`app.ts`, 의존성 없이 직접 헤더 설정).
- **개발 환경:** Vite 개발 서버는 `/api`를 백엔드로 프록시해 운영과 같은 출처처럼 동작시킨다 (가정, 쿠키 경로 유지 목적).
- **DB 스키마:** `backend/db/schema.sql` 한 파일로 관리하고 수동 적용한다. 마이그레이션 도구는 도입하지 않는다 (가정, PRD 8장 "스키마 SQL 파일").
- **헬스체크:** Day 1 완료 기준에 따라 헬스체크 API를 둔다 (PRD 8장). 경로는 `/api/health`다 (가정).
- **모니터링·알림·이중화는 만들지 않는다** (PRD 4.2). 병목 대응은 인덱스·커넥션 풀을 먼저, 필요 시 프로세스 확장 순서로 한다 (R-03, 가정).

## 6. 프론트엔드, 백엔드별 디렉토리 구조

### 6.1 저장소 최상위

```
team-caltalk/
├── CLAUDE.md
├── docs/            # 1~8번 문서
├── frontend/        # React 앱 (Vite)
├── backend/         # Express API 서버
└── loadtest/        # k6 스크립트, 부하용 시드 (NFR-03)
```

- `frontend/`, `backend/` 이름과 단일 저장소(모노레포) 구성은 가정이다. 루트에 공용 `package.json`·workspace 설정은 두지 않고 각자 `package.json`을 가진다 (가정).
- 기존 `prompt/`, `.claude/`, `.mcp.json`, `.playwright-mcp/`는 개발 도구용이며 앱 구조에 포함하지 않는다.

### 6.2 프론트엔드 (`frontend/`)

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts            # @tailwindcss/vite 플러그인, /api 프록시
└── src/
    ├── main.tsx              # 진입점. index.css import, QueryClientProvider
    ├── index.css             # 유일한 CSS. @import "tailwindcss"; (+ 필요 시 @theme)
    ├── App.tsx               # 앱 시작 시 재발급 시도, 화면 상태에 따라 pages 선택
    ├── pages/
    │   ├── LoginPage.tsx         # WF-01
    │   ├── SignupPage.tsx        # WF-02
    │   ├── MainPage.tsx          # WF-03/04 (탭: 목록/캘린더)
    │   ├── CategoryPage.tsx      # WF-07
    │   └── ProfilePage.tsx       # WF-08 (P1)
    ├── components/
    │   ├── Button.tsx, Input.tsx, Badge.tsx   # 반복 클래스 묶음 추출본
    │   ├── Header.tsx                         # 공통 헤더
    │   ├── TodoList.tsx, TodoRow.tsx, FilterBar.tsx
    │   ├── CalendarGrid.tsx
    │   ├── TodoModal.tsx                      # WF-05
    │   └── ConfirmDialog.tsx                  # WF-06, 카테고리 삭제 확인
    ├── hooks/
    │   ├── useAuth.ts, useApiClient.ts, useProfile.ts
    │   ├── useCategories.ts
    │   ├── useTodos.ts, useTodoMutations.ts, useTodoForm.ts
    │   └── useCalendarMonth.ts
    ├── stores/
    │   ├── authStore.ts          # Access Token(메모리), 로그인 여부
    │   └── uiStore.ts            # 현재 페이지(초기값 login), 탭, 필터, 캘린더 월, 열린 모달
    ├── api/
    │   ├── client.ts             # axios 인스턴스: 요청 인터셉터로 Bearer 첨부, 응답 인터셉터로 401 시 재발급 1회(동시 401은 재발급 1개 공유) 후 재시도
    │   ├── queryClient.ts        # QueryClient 단일 인스턴스. main.tsx(Provider)와 client.ts(재발급 실패 시 clear)가 import
    │   ├── auth.ts, todos.ts, categories.ts, users.ts   # 엔드포인트별 호출 함수와 응답 타입
    └── lib/
        ├── date.ts               # '오늘'(로컬 YYYY-MM-DD), 월 그리드 계산 등 순수 함수
        └── validation.ts         # 화면 검증 함수 (BR-08, BR-11, 3장 제약)
```

| 디렉토리      | 역할                                                                                                             | 넣지 않는 것                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `pages/`      | 화면 하나에 대응(WF-01~08). 컴포넌트를 배치하고 훅을 호출해 결과를 내려준다                                      | 서버 호출, 비즈니스 로직             |
| `components/` | 재사용 UI와 모달. props를 받아 렌더링만 한다 (파일당 100줄 이하 목표)                                            | 서버 호출, store 직접 접근, CSS 파일 |
| `hooks/`      | 서버 통신(TanStack Query), 폼 상태·검증, store 구독, 파생 데이터(필터·캘린더 그리드). 훅 목록은 PRD 7.4를 따른다 | JSX                                  |
| `stores/`     | Zustand store. UI 상태와 인증 상태만                                                                             | 서버 데이터 캐시                     |
| `api/`        | HTTP 호출 함수. 토큰 첨부와 401 재발급 처리는 `client.ts` 한 곳                                                  | React 코드, 상태                     |
| `lib/`        | 의존성 없는 순수 함수                                                                                            | React, store, api import             |

- 디렉토리는 위 6개로 시작하고 하위 디렉토리로 더 쪼개지 않는다. 파일이 늘어 찾기 어려워질 때만 나눈다 (가정).
- 화면 목록은 PRD 7.2의 5개(로그인/가입/메인/카테고리 관리/내 정보)다.

### 6.3 백엔드 (`backend/`)

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
├── swagger.yaml              # API 명세 원본 (요청·응답·상태 코드)
├── db/
│   ├── schema.sql            # 테이블·제약·인덱스 (users, categories, todos, refresh_tokens)
│   └── seed.sql              # 개발용 시드(도메인 5.2 예시 데이터). 자동화 테스트의 DB 초기화에도 쓴다
├── requests/                 # 수동 API 확인용 요청 모음 (Day 1 산출물: auth.http, ac.http)
├── test/                     # node:test 자동화 테스트 (*.test.ts, helpers.ts)
└── src/
    ├── server.ts             # 진입점: config 로드, app 시작(listen)
    ├── app.ts                # Express 조립: CORS 헤더(`CORS_ORIGIN`), 본문 100KB 제한, cookie-parser, 라우터 마운트, 정적 서빙, 오류 핸들러
    ├── config.ts             # 환경 변수 읽기·검증, 상수(PRD 값)
    ├── db.ts                 # pg Pool, DATE 문자열 파서(OID 1082), 트랜잭션 헬퍼
    ├── errors.ts             # 오류 클래스(400 검증 / 401 인증 / 404 없음, 그 외 상태는 `HttpError`)
    ├── routes/
    │   ├── authRoutes.ts         # 가입, 로그인, 재발급, 로그아웃
    │   ├── userRoutes.ts         # 내 정보 수정, 비밀번호 변경 (P1)
    │   ├── categoryRoutes.ts     # 목록, 생성, 이름 변경, 삭제
    │   ├── todoRoutes.ts         # 등록, 수정, 삭제, 목록(필터), 월 조회
    │   ├── healthRoutes.ts       # 헬스체크
    │   └── docsRoutes.ts         # 개발 환경 전용 /api-docs (CDN swagger-ui로 swagger.yaml 표시)
    ├── services/
    │   ├── authService.ts        # 가입(+기본 카테고리), 로그인, 토큰 발급·회전·폐기
    │   ├── userService.ts
    │   ├── categoryService.ts    # BR-13, BR-17, BR-18
    │   └── todoService.ts        # BR-06, BR-08, BR-10, BR-12, 소유권 조건
    ├── validators/
    │   ├── authValidator.ts, categoryValidator.ts, todoValidator.ts   # 3장 제약, BR-08, BR-11
    └── middleware/
        ├── auth.ts               # Access Token 검증 → 요청에 사용자 ID(sub) 설정
        └── loginLimit.ts         # 로그인 실패 횟수 제한 (P1, NFR-11)
```

| 디렉토리 / 파일                   | 역할                                                                 | 넣지 않는 것           |
| --------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| `db/schema.sql`                   | 스키마의 유일한 원본. 무결성 규칙은 DB 제약으로 표현 (PRD 7.3)       | 앱 로직                |
| `routes/`                         | 엔드포인트 정의. 요청 파싱 → validator → service → 응답              | SQL, 비즈니스 규칙     |
| `services/`                       | 비즈니스 규칙과 SQL, 트랜잭션 경계. 모든 쿼리에 소유자 조건 (NFR-09) | `req`/`res`, 응답 포맷 |
| `validators/`                     | 도메인 정의서 3장 제약 검증, 항목별 사유 생성 (NFR-10)               | DB 조회                |
| `middleware/`                     | 요청 공통 처리(인증, 로그인 제한)                                    | 비즈니스 규칙          |
| `config.ts`, `db.ts`, `errors.ts` | 설정, DB 연결, 오류 타입. 각 1개 파일                                | -                      |

- 리소스가 4개(auth, user, category, todo)이므로 라우트·서비스·검증 파일은 리소스당 1개로 시작한다. Repository, DTO 변환 계층, DI 컨테이너는 만들지 않는다 (가정).
- 백엔드는 빌드하지 않고 Node.js 내장 타입 제거로 실행한다 (`node src/server.ts`, 개발은 `node --watch`). 타입 검사는 `tsc --noEmit`만 한다. `enum` 등 타입 제거가 불가능한 문법은 쓰지 않는다 (PRD 7.2).
- 토큰 발급·검증 로직은 별도 `utils`로 빼지 않고 `authService.ts`와 `middleware/auth.ts`에 둔다. 두 곳 이상에서 쓰이게 될 때만 추출한다 (가정).

## 7. 확인이 필요한 항목 (문서에 근거 없음 또는 불명확)

| 항목                                  | 내용                                                                                                                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useApiClient` 훅과 401 재발급 공유   | PRD 7.4는 컴포넌트에서 `fetch` 직접 호출 금지와 훅 `useApiClient`를 정하고, 6.4는 동시 401 시 재발급 요청 1개 공유를 요구한다. 훅 인스턴스와 별개로 공유 상태가 필요하므로 이 문서는 `api/client.ts`(순수 모듈)에 두고 훅이 이를 감싸는 것으로 가정했다 |
| 비밀번호 허용 문자                    | NFR-07은 영문·숫자·ASCII 특수문자만 허용(가정)한다고 하나 도메인 정의서 3.1 제약에는 문자 집합 제한이 없다. `validators/`에 어느 쪽을 반영할지 정해야 한다                                                                                              |
| NFR-11(메모리 카운터)과 프로세스 확장 | R-03이 Node cluster 확장을 언급하는데, 메모리 카운터는 프로세스별로 따로 센다. 확장 시 제한 횟수가 달라진다                                                                                                                                             |
| 저장소 구성                           | `frontend/`·`backend/`·`loadtest/` 이름과 모노레포 구성은 문서에 없다                                                                                                                                                                                   |
