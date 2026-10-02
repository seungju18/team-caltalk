# team-caltalk 스타일 가이드

## 문서 변경 이력

> 변경 시 표 맨 아래에 한 줄씩 누적 기록한다. 기존 행은 수정하지 않는다.

| 버전 | 변경자    | 변경내용                                                                                 | 변경일시   |
| ---- | --------- | ---------------------------------------------------------------------------------------- | ---------- |
| 0.1  | seungju18 | 참고 화면(어두운 캘린더 앱) 기반 스타일 가이드 초안 작성                                 | 2026-10-01 |
| 0.2  | seungju18 | 라이트 테마 참고 화면 반영: 라이트 기본 + OS 설정에 따른 다크 토큰, `muted-bg` 토큰 추가 | 2026-10-01 |
| 0.3  | seungju18 | 다크 전환을 OS 설정에서 헤더 버튼(`.dark` 클래스)으로 변경, 9장 확인 항목 정리 (PRD v0.12) | 2026-10-01 |

> 기준 문서: `docs/2-PRD.md` v0.12 (7.1·7.4 스타일 규칙, NFR-12·13), `docs/4-wireframes.md` v0.3 (화면 구성), `docs/5-project-principle.md` v1.1 (3.3 프론트엔드 코드 규칙). 이 문서는 색·글꼴·간격·컴포넌트 모양만 정한다. 화면 구성·동작은 와이어프레임, 코드 규칙은 PRD 7.4를 따른다. 수치는 참고 화면(라이트·다크 각 1장)에서 눈으로 추정한 값이다 (가정).

## 0. 원칙

- **라이트 기본, 다크는 헤더 버튼으로 전환한다.** 색은 토큰 하나에 라이트·다크 두 값을 둔다. `<html>`에 `dark` 클래스가 붙으면 다크 값으로 바뀐다. OS 설정(`prefers-color-scheme`)은 따르지 않는다. 선택값은 다음 접속에도 유지된다 (PRD 7.2 테마). 컴포넌트에서 `dark:` 접두사를 쓰지 않고 토큰 클래스만 쓴다.
- **색은 의미에만 쓴다.** 배경·선·글자는 회색 단계로 만들고, 보라(주요 동작·선택 상태), 빨강(일요일·오류·지연), 초록(완료) 같은 강조색은 의미가 있을 때만 쓴다.
- **선으로 구분한다.** 그림자·그라데이션 없이 1px 선과 배경 단계 차이로 영역을 나눈다. 모서리는 거의 각지게(2~4px) 둔다.
- **Tailwind 유틸리티만.** 토큰은 `src/index.css`에만 정의하고 JSX `className`으로 쓴다. CSS 클래스·`@apply`·`style={{}}`(캘린더 막대 위치 등 런타임 값 제외)는 쓰지 않는다 (PRD 7.4).

## 1. 색상 토큰

`src/index.css` (유일한 CSS 파일, PRD 7.4). `@theme`에 라이트 값을 두고, 다크 값은 `.dark` 블록에서 같은 변수를 덮어쓴다. 컴포넌트 클래스(`bg-bg`, `text-fg` 등)는 두 테마에서 같다.

```css
@import "tailwindcss";

@theme {
  /* 배경 단계 */
  --color-bg: #ffffff;           /* 앱 전체·캘린더 칸 */
  --color-surface: #ffffff;      /* 헤더·사이드바·모달 */
  --color-muted-bg: #f7f7f7;     /* 요일 머리글 줄, 사이드바 선택 항목, 미니 캘린더 */
  --color-surface-hover: #f2f2f2;
  --color-today: #f3f8fb;        /* 오늘 칸 배경 */

  /* 선 */
  --color-line: #e5e5e5;         /* 캘린더 격자·구분선 */
  --color-line-strong: #cccccc;  /* 입력란·버튼 테두리 */
  --color-today-line: #444444;   /* 오늘 칸 테두리 */

  /* 글자 */
  --color-fg: #222222;           /* 본문·날짜 숫자 */
  --color-fg-muted: #777777;     /* 보조 정보(카테고리 이름, 기간) */
  --color-fg-subtle: #b3b3b3;    /* 이전·다음 달 날짜, placeholder */

  /* 강조 */
  --color-primary: #6c5ce7;        /* 주요 버튼, 선택된 탭, 체크된 체크박스 */
  --color-primary-hover: #5a4bd4;
  --color-primary-fg: #6c4fe0;     /* 배경 위 보라 글자(링크, 캘린더 할일 제목) */
  --color-danger: #e02020;         /* 일요일, 오류 문구, 지연 */
  --color-success: #17924a;        /* 완료 */
}

/* <html class="dark">일 때 덮어쓴다. 클래스는 테마 버튼이 붙이고 뗀다 */
.dark {
  --color-bg: #121212;
  --color-surface: #1a1a1a;
  --color-muted-bg: #1a1a1a;
  --color-surface-hover: #222222;
  --color-today: #1c2326;
  --color-line: #2c2c2c;
  --color-line-strong: #444444;
  --color-today-line: #444444;
  --color-fg: #e6e6e6;
  --color-fg-muted: #9a9a9a;
  --color-fg-subtle: #6b6b6b;
  --color-primary: #7b68ee;
  --color-primary-hover: #6a56e0;
  --color-primary-fg: #a89bff;
  --color-danger: #ff4040;
  --color-success: #2ecc71;
}
```

| 토큰                                             | 쓰는 곳                                                |
| ------------------------------------------------ | ------------------------------------------------------ |
| `bg-bg`                                          | `body`, 메인 영역, 캘린더 칸                           |
| `bg-surface`                                     | 헤더, 사이드바, 모달, 드롭다운, 모바일 메뉴            |
| `bg-muted-bg`                                    | 요일 머리글 줄, 사이드바에서 선택된 항목               |
| `bg-surface-hover`                               | 목록 행·메뉴 항목 hover                                |
| `bg-today` + `outline-today-line`                | 캘린더의 오늘 칸                                       |
| `border-line`                                    | 캘린더 격자, 섹션 구분선, 목록 행 사이, 헤더 아래      |
| `text-fg` / `text-fg-muted` / `text-fg-subtle`   | 본문 / 보조 / 비활성                                   |
| `bg-primary text-white`                          | 주요 버튼(할일 등록, 저장), 선택된 탭·필터             |
| `text-primary-fg`                                | 캘린더 칸 안의 할일 제목, 링크                         |
| `text-danger`                                    | 일요일 날짜·요일, 입력 오류 문구, 위험 동작 버튼 글자  |

- 글자와 배경의 대비는 본문(`fg` on `bg`) 기준 4.5:1 이상을 유지한다. `fg-subtle`은 비활성 정보에만 쓴다.
- 참고 라이트 화면의 할일 글자는 옅은 보라(#a58bf2 안팎)지만 흰 배경 대비가 낮아 `primary-fg`는 한 단계 진하게 정했다. 같은 이유로 라이트의 `success`도 진한 초록이다.
- 토요일은 별도 색 없이 `text-fg`로 둔다 (참고 화면과 같음).
- 날짜 입력(`<input type="date">`) 팝업과 스크롤바가 테마를 따르도록 최상위 요소에 `[color-scheme:light_dark]`를 준다.

## 2. 상태 배지 색 (BR-10)

| 상태                   | 배지 클래스                                      | 비고                                |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| 시작 전 `not_started`  | `border border-line-strong text-fg-muted`        | 채우지 않는 테두리 배지             |
| 진행 중 `in_progress`  | `bg-primary/15 text-primary-fg`                  |                                     |
| 완료 `done`            | `bg-success/15 text-success`                     | 제목은 `text-fg-muted line-through` |
| 지연 `overdue`         | `bg-danger/15 text-danger`                       |                                     |

배지 공통: `inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium`. 문구는 도메인 용어(시작 전 / 진행 중 / 완료 / 지연)를 그대로 쓴다. 투명도 배경이라 두 테마에서 같은 클래스로 쓴다.

## 3. 글꼴

- 글꼴: `font-sans` (시스템 기본: 맑은 고딕 / Apple SD Gothic Neo). 웹 폰트를 추가하지 않는다.
- 숫자가 세로로 정렬되어야 하는 곳(캘린더 날짜, 기간)은 `tabular-nums`.

| 용도                          | 클래스                          |
| ----------------------------- | ------------------------------- |
| 현재 월 표시 (2026.10)        | `text-2xl font-bold` (모바일 `text-xl`) |
| 페이지·모달 제목              | `text-lg font-bold`             |
| 섹션 제목 (사이드바 그룹 등)  | `text-sm font-bold`             |
| 본문·버튼·입력                | `text-sm` (모바일 입력은 `text-base`, iOS 확대 방지) |
| 캘린더 날짜 숫자·요일         | `text-sm`                       |
| 보조 정보·배지·도움말         | `text-xs`                       |

## 4. 간격·모양

- 간격은 Tailwind 기본 4px 단위만 쓴다. 자주 쓰는 값: 요소 사이 `gap-2`(8px), 패널 안쪽 `p-4`(16px), 섹션 사이 `py-4` + `border-b border-line`.
- 모서리: 버튼·입력·배지 `rounded-sm`(2px), 모달·드롭다운 `rounded`(4px). 큰 둥근 모서리는 쓰지 않는다.
- 높이: 헤더 `h-14`, 버튼·입력 `h-9`, 주요 버튼 `h-10`.
- 그림자: 모달·드롭다운에만 `shadow-lg`. 그 외에는 없다.

## 5. 레이아웃 (WF-03·04)

```
┌───────────────────────── 헤더 h-14 bg-surface border-b ─────────────────────────┐
│ 로고 · 탭(목록/캘린더)                                     사용자 이름 · 메뉴 │
├──────── 사이드바 w-72 (lg 이상) ────────┬──────────── 메인 bg-bg ──────────────┤
│ [할일 등록] 주요 버튼 (w-full)          │ 툴바: 2026.10 ◀ ▶ [오늘]   필터/탭   │
│ 카테고리 목록 + [+] [관리]             ├───────────────────────────────────────┤
│                                          │ 캘린더 격자 또는 목록                 │
└──────────────────────────────────────────┴───────────────────────────────────────┘
```

- 사이드바는 `lg:` 이상에서만 보인다 (`hidden lg:flex`). `bg-surface border-r border-line`. 선택된 항목은 `bg-muted-bg text-primary-fg`.
- 메인 툴바: `flex items-center gap-2 px-4 py-3 border-b border-line`.
- 모바일(768px 미만)은 헤더 [메뉴] 버튼으로 사이드바 내용을 전체 화면 패널(`fixed inset-0 bg-surface`)로 연다 (NFR-12, WF-03 모바일).

## 6. 컴포넌트

반복 클래스 묶음은 컴포넌트로 추출한다 (PRD 7.4). 조건부 클래스는 템플릿 리터럴로 조합한다.

### 6.1 Button

| 종류        | 클래스                                                                                       | 쓰는 곳                          |
| ----------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| primary     | `h-10 px-4 rounded-sm bg-primary text-white font-bold hover:bg-primary-hover`                | 할일 등록, 저장, 로그인          |
| secondary   | `h-9 px-3 rounded-sm border border-line-strong bg-surface text-fg hover:bg-surface-hover`    | 취소, [오늘], ◀ ▶                |
| danger      | `h-9 px-3 rounded-sm border border-line-strong bg-surface text-danger hover:bg-surface-hover`| 삭제 확인                        |
| icon        | `h-9 w-9 inline-flex items-center justify-center rounded-sm border border-line-strong bg-surface` | 이전/다음 월, 메뉴          |

- 비활성: `disabled:opacity-40 disabled:cursor-not-allowed`. 처리 중에는 문구를 "저장 중…"으로 바꾸고 비활성한다.
- 포커스: 모든 버튼·입력에 `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`.

### 6.2 탭·필터 (세그먼트 버튼)

참고 화면의 [일간|주간|월간] 묶음 모양을 목록/캘린더 탭과 상태 필터에 쓴다.

- 묶음: `inline-flex border border-line-strong rounded-sm overflow-hidden`
- 항목: `h-9 px-3 text-sm bg-surface border-l border-line-strong first:border-l-0`
- 선택: `bg-primary text-white` / 미선택: `text-fg hover:bg-surface-hover`
- 모바일 필터는 `flex-wrap`으로 2줄 칩이 되게 한다 (WF-03 모바일).

### 6.3 Input

- 입력란: `h-9 w-full px-3 rounded-sm bg-bg border border-line-strong text-fg placeholder:text-fg-subtle focus:border-primary`
- 오류 상태: `border-danger`, 입력란 바로 아래 `text-xs text-danger mt-1`에 서버 사유(`errors[].reason`)를 표시한다 (BR-11).
- 라벨: `text-sm text-fg-muted mb-1`. 날짜는 `<input type="date">`를 쓰고, 팝업 색은 1장의 `color-scheme` 설정을 따른다 (PRD 5.1).

### 6.4 Checkbox

- `size-4 rounded-sm accent-primary` (네이티브 체크박스, `accent-color`로 색만 바꾼다).
- 완료 체크박스(FR-14)는 목록 행 왼쪽에 둔다.

### 6.5 캘린더 (WF-04)

- 요일 머리글: `grid grid-cols-7 bg-muted-bg border-b border-line text-sm`, 각 칸 `px-3 py-2`. 일요일만 `text-danger`.
- 날짜 칸: `min-h-28 border-r border-b border-line p-2` (모바일 `min-h-16 p-1`).
- 날짜 숫자: `text-sm tabular-nums`. 이전·다음 달 날짜는 `text-fg-subtle`, 일요일은 `text-danger`(이전·다음 달 일요일은 `text-danger/50`).
- 오늘 칸: `bg-today outline outline-1 outline-today-line -outline-offset-1`.
- 할일 표시(768px 이상): 칸 안 한 줄 `truncate text-xs text-primary-fg`. 여러 날에 걸친 할일 막대는 `bg-primary/15 text-primary-fg rounded-sm px-1`이고 위치는 `style`로 계산한다 (PRD 7.4 예외). 완료된 할일은 `text-fg-muted line-through`.
- 할일 표시(768px 미만): 제목 대신 `text-xs text-primary-fg`로 "N건"만 (NFR-13).

### 6.6 목록 행 (WF-03)

- 행: `flex items-center gap-3 px-4 py-3 border-b border-line hover:bg-surface-hover`
- 제목 `text-sm text-fg`, 아래 보조 줄 `text-xs text-fg-muted`(카테고리 · 시작일자 ~ 종료일자), 오른쪽 상태 배지.
- 모바일은 2줄 카드 형태: 제목+배지 / 카테고리·기간 (WF-03 모바일).
- 빈 목록: 가운데 `py-16 text-sm text-fg-muted` 문구.

### 6.7 모달·확인 대화상자 (WF-05·06)

- 배경 덮개: `fixed inset-0 bg-black/50`
- 패널: `bg-surface border border-line rounded shadow-lg w-full max-w-md p-6` (모바일은 `fixed inset-0 rounded-none`으로 전체 화면, WF-05 모바일)
- 하단 버튼: `flex justify-end gap-2 mt-6`, 오른쪽 끝이 primary(또는 danger).

### 6.8 알림 문구

- 목록 위 1줄 오류(FR-14 실패 등): `px-4 py-2 text-sm text-danger bg-danger/10 border-b border-line`
- 전체 오류(서버 응답 없음 등): 같은 모양을 화면 상단에 둔다.

## 7. 반응형 (NFR-12·13)

- 접두사 없는 클래스가 모바일, `md:`(768px)·`lg:`(1024px)로 넓은 화면을 덮어쓴다. 임의 미디어 쿼리는 쓰지 않는다 (PRD 7.4).
- 확인 폭: 375px / 768px / 1280px에서 가로 스크롤이 없어야 한다 (8-plan FE-11). 라이트·다크 각각 확인한다.

## 8. 참고 화면에서 가져오지 않는 것

- 다른 서비스의 로고·서비스 아이콘 줄·브랜드 색(초록 로고 등)은 쓰지 않는다. 강조색은 보라 하나다.
- 음력 날짜, 공휴일 이름, 알림 숫자 배지, 기념일 등 기능은 범위 외라 스타일도 정하지 않는다 (도메인 정의서 6.1).
- 아이콘 라이브러리는 추가하지 않는다 (PRD 7.2). 필요한 아이콘(◀ ▶, 메뉴 ☰, 닫기 ✕)은 문자로 쓴다.

## 9. 확인이 필요한 항목

- 없음. 다크 모드 범위·`index.css` 내용 두 항목은 PRD v0.12에서 정리했다.
