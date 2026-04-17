# BatchBridge 운영 콘솔 개편 Jira 티켓 본문 초안

## 문서 목적

이 문서는 Confluence `491561`의 Jira 티켓 작성 가이드라인에 맞춰, 운영 콘솔 개편 작업을 Jira 티켓 단위로 분할한 초안이다. 티켓 생성은 하지 않았고, 바로 복사해 사용할 수 있도록 제목과 본문을 함께 정리했다.

## 분할 원칙

- 1티켓 = 1화면 또는 1공통 시스템
- 서로 다른 페이지는 분리
- 같은 페이지 내부 상태 분기가 강하더라도 구현 맥락이 강하게 묶이면 하나의 티켓으로 유지
- 모든 FE 티켓에 기존 API URL, 요청/응답 JSON 예시, 에러 코드 케이스 포함

---

## 1. [FE] 운영 콘솔 전역 토큰 및 테마 재정의

**선행 작업:** 없음

**작업 내용**

- 설계 문서 `docs/operational-console-screen-plan.md` 3장, 4장 참고
- 설계 문서 `docs/operational-console-system-spec.md` 2장, 3장, 4장, 5장 참고
- `src/index.css` 전역 토큰 재정의
- 브랜드 green 기반 neutral tint, status color, surface, border, text 역할 재정의
- 라이트/다크 모드 공통 계층 유지
- 운영 콘솔용 타이포그래피 scale, spacing rhythm, radius/shadow 밀도 조정
- 카드 중심 기본 톤 축소, strip/list/viewer 기반 화면을 수용할 수 있는 전역 surface tone 정리
- 기존 다국어 화면에서 한글/영문 모두 깨지지 않는 heading/body hierarchy 정리

**API 명세**

- API 변경 없음
- 직접 신규 호출 없음
- 기존 화면에서 사용하는 API 응답 표시 계층만 유지
- 대표 연동 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 12,
    "label": "Batch A",
    "model": "claude-sonnet",
    "status": "DRAFT",
    "promptCount": 3,
    "createdAt": "2026-04-17T14:05:00Z"
  }
}
```

- 에러 코드 케이스:
  - `NETWORK_ERROR`
  - `UNKNOWN_ERROR`

**완료 조건**

- 전역 스타일 토큰만으로 브랜드색, 상태색, 표면색 역할이 구분된다
- 기존 모든 페이지가 깨지지 않고 렌더링된다
- 라이트/다크 모드에서 대비와 위계가 유지된다
- 한글/영문 기준으로 heading, badge, button 텍스트 overflow가 기존 대비 악화되지 않는다

---

## 2. [FE] 운영 콘솔 공통 앱 셸 및 페이지 헤더 패턴 적용

**선행 작업:** 1번 티켓

**작업 내용**

- 설계 문서 `docs/operational-console-screen-plan.md` 4장, 5장 참고
- 설계 문서 `docs/operational-console-system-spec.md` 6장, 7장 참고
- `src/components/layout/Layout.tsx` 운영 콘솔형 앱 셸로 재구성
- 글로벌 헤더의 브랜드, 1차 내비게이션, locale/theme 제어 시각 위계 정리
- 페이지 공통 `Page Header`, `Meta Strip`, `Toolbar`, `Status Badge` 패턴 적용 가능한 구조 정리
- 각 페이지에서 재사용 가능한 상단 패턴을 정의하고 현재 페이지들에 적용 가능한 수준으로 공통화
- 불필요한 generic card header 어조 축소

**API 명세**

- API 변경 없음
- 기존 페이지 API 호출 유지
- 영향 대상 URL:
  - `GET /batches`
  - `GET /batches/{id}`
  - `GET /batches/{batchId}/prompts/{promptId}`
  - `GET /templates`
- 대표 응답 예시:

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 12,
        "label": "Batch A",
        "model": "claude-sonnet",
        "status": "IN_PROGRESS",
        "promptCount": 48,
        "successCount": 31,
        "failedCount": 2,
        "createdAt": "2026-04-17T14:05:00Z"
      }
    ],
    "totalElements": 128,
    "totalPages": 15,
    "page": 1,
    "size": 9
  }
}
```

- 에러 코드 케이스:
  - `NETWORK_ERROR`
  - `UNKNOWN_ERROR`

**완료 조건**

- `Layout` 기준으로 운영 콘솔형 글로벌 헤더/푸터 구조가 적용된다
- 각 주요 페이지가 `title + description + primary action + secondary control` 패턴을 따른다
- 상태 badge, meta item, toolbar의 기본 사용 위치가 공통화된다
- 공통 패턴 적용 후에도 기존 페이지 라우팅과 기능 동작은 유지된다

---

## 3. [FE] 배치 목록 화면 운영형 리스트 레이아웃 개편

**선행 작업:** 2번 티켓

**작업 내용**

- 설계 문서 `docs/operational-console-screen-plan.md` 6.1 참고
- 설계 문서 `docs/operational-console-wireframes.md` 4장 참고
- `src/pages/BatchListPage.tsx` 카드 그리드 중심 구조를 row-based list 또는 table/list hybrid 구조로 개편
- 페이지 헤더 하단에 summary strip 추가: 총 배치 수, 진행 중 수, 실패 수, 마지막 새로고침 맥락
- 상태 탭, 페이지 사이즈, 새로고침, 새 배치 액션을 한 줄 운영 툴바로 재배치
- 행 단위에서 `배치명/모델`, `상태/프롬프트 수/성공 실패 수`, `생성 시각`, `행 액션`이 빠르게 비교되도록 재배치
- empty, loading, error, deleting 상태를 운영형 목록 톤으로 정리
- 모바일에서 2행 또는 3행 compressed row 구조 적용

**API 명세**

- 조회 URL: `GET /batches`
- 요청 쿼리:

```json
{
  "status": "IN_PROGRESS",
  "page": 1,
  "size": 9
}
```

- 응답 예시:

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 12,
        "label": "Marketing Summary Batch",
        "model": "claude-sonnet",
        "status": "IN_PROGRESS",
        "promptCount": 48,
        "successCount": 31,
        "failedCount": 2,
        "createdAt": "2026-04-17T14:05:00Z",
        "submittedAt": "2026-04-17T14:10:00Z",
        "completedAt": null
      }
    ],
    "totalElements": 128,
    "totalPages": 15,
    "page": 1,
    "size": 9
  }
}
```

- 삭제 URL: `DELETE /batches/{id}`
- 에러 코드 케이스:
  - `NETWORK_ERROR`
  - `BATCH_NOT_FOUND`
  - `INTERNAL_SERVER_ERROR`

**완료 조건**

- 목록 본문이 카드 그리드가 아니라 비교 가능한 행 기반 구조로 동작한다
- summary strip과 toolbar가 분리되어 현재 뷰 맥락을 설명한다
- Draft 배치 삭제 액션은 행 수준에서 동작하고 진행 상태가 노출된다
- 모바일에서도 상태, 모델, 프롬프트 수, 생성 시각, 주요 액션이 누락되지 않는다

---

## 4. [FE] 배치 상세 화면 상태판 및 작업면 구조 개편

**선행 작업:** 2번 티켓

**작업 내용**

- 설계 문서 `docs/operational-console-screen-plan.md` 6.3 참고
- 설계 문서 `docs/operational-console-wireframes.md` 6장 참고
- `src/pages/BatchDetailPage.tsx` 상단 영역을 `배치 메타 스트립`과 `액션 그룹`으로 분리
- `배치명`, `상태`, `모델`, `생성/제출/완료 시각`, `배치 레벨 오류`를 운영형 메타 구조로 재배치
- Draft 상태에서 `prompt list`와 `add prompt composer`를 split-pane 구조로 재구성
- Draft 상태 prompt item에 `번호`, `이름`, `타입`, `첨부 여부`, `preview`를 우선 노출
- Completed/Failed 상태에서 prompt 영역을 card 나열 대신 `section stack`으로 재구성
- prompt section header에서 `이름`, `상태`, `타입`, `결과 유무`를 먼저 노출
- `submit`, `sync`, `resync`, `edit`, `delete` 액션을 우선순위에 맞게 재정렬

**API 명세**

- 조회 URL: `GET /batches/{id}`
- 제출 URL: `POST /batches/{id}/submit`
- 동기화 URL: `POST /batches/{id}/sync`
- 프롬프트 재동기화 URL: `POST /batches/{id}/sync-prompts`
- 프롬프트 추가 URL: `POST /batches/{id}/prompts`
- 배치 수정 URL: `PATCH /batches/{id}`
- 배치 삭제 URL: `DELETE /batches/{id}`
- 프롬프트 삭제 URL: `DELETE /batches/{id}/prompts/{promptId}`

- `GET /batches/{id}` 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 12,
    "label": "Marketing Summary Batch",
    "model": "claude-sonnet",
    "status": "COMPLETED",
    "promptCount": 3,
    "successCount": 2,
    "failedCount": 1,
    "createdAt": "2026-04-17T14:05:00Z",
    "submittedAt": "2026-04-17T14:10:00Z",
    "completedAt": "2026-04-17T14:32:00Z",
    "errorMessage": null,
    "prompts": [
      {
        "id": 101,
        "label": "Prompt A",
        "userPrompt": "Summarize release notes",
        "status": "COMPLETED",
        "promptType": "TEXT",
        "attachments": [],
        "responseContent": "Summary..."
      }
    ]
  }
}
```

- `POST /batches/{id}/prompts` 요청 예시:

```json
{
  "label": "Prompt A",
  "systemPrompt": "You are a concise assistant.",
  "userPrompt": "Summarize release notes",
  "attachments": [
    {
      "fileName": "release.txt",
      "fileContent": "..."
    }
  ],
  "promptType": "TEXT"
}
```

- 에러 코드 케이스:
  - `BATCH_NOT_FOUND`
  - `BATCH_NOT_EDITABLE`
  - `BATCH_EMPTY`
  - `BATCH_NOT_SYNCED`
  - `PROMPT_NOT_FOUND`
  - `INVALID_REQUEST`
  - `NETWORK_ERROR`

**완료 조건**

- 상단에서 배치 상태와 가능한 액션을 즉시 파악할 수 있다
- Draft 상태에서 목록 관리와 prompt 추가 작성이 동시에 가능하다
- Completed/Failed 상태에서 prompt별 상태 판단이 펼치기 전에도 가능하다
- 배치 레벨 에러와 프롬프트 레벨 에러가 시각적으로 분리된다
- 기존 배치 제출, 수정, 삭제, sync, resync 기능이 유지된다

---

## 5. [FE] 배치 생성 화면 2단계 작성 흐름 개편

**선행 작업:** 2번 티켓

**작업 내용**

- 설계 문서 `docs/operational-console-screen-plan.md` 6.2 참고
- 설계 문서 `docs/operational-console-wireframes.md` 5장 참고
- `src/pages/BatchCreatePage.tsx`를 `Step 1. Batch Setup`, `Step 2. First Prompt` 구조로 재구성
- 우측 또는 하단에 `Summary Panel` 추가: 모델, 프롬프트 타입, 첨부 수, 제출 가능 여부
- 시스템 프롬프트를 단순 접힘이 아니라 `Optional System Instruction`으로 재정의하고 값 존재 여부 표시
- 첨부/외부 컨텍스트/import 영역을 보조 입력군으로 구조화
- edit 타입 선택 시 reference media 구역이 자연스럽게 드러나도록 전환
- 하단 `Sticky Action Bar`로 취소/생성 액션과 validation 맥락 고정

**API 명세**

- 모델 조회 URL: `GET /models`
- 배치 생성 URL: `POST /batches`

- `GET /models` 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": "claude-sonnet",
      "displayName": "Claude Sonnet",
      "supportedPromptTypes": ["TEXT", "IMAGE_EDIT"]
    }
  ]
}
```

- `POST /batches` 요청 예시:

```json
{
  "label": "Marketing Summary Batch",
  "model": "claude-sonnet",
  "prompt": {
    "label": "Prompt A",
    "systemPrompt": "You are a concise assistant.",
    "userPrompt": "Summarize release notes",
    "attachments": [
      {
        "fileName": "release.txt",
        "fileContent": "..."
      }
    ],
    "promptType": "TEXT"
  }
}
```

- `POST /context/preview` 요청 예시:

```json
{
  "githubPrUrl": "https://github.com/org/repo/pull/12",
  "jiraKeys": ["DEV-123"],
  "confluencePageIds": ["491561"]
}
```

- 에러 코드 케이스:
  - `UNSUPPORTED_MODEL`
  - `INVALID_REQUEST`
  - `NETWORK_ERROR`
  - `INTERNAL_SERVER_ERROR`

**완료 조건**

- 사용자가 단계적으로 `배치 설정`과 `첫 프롬프트 작성`을 인지할 수 있다
- summary panel 또는 동등한 요약 구조에서 현재 작성 상태를 바로 확인할 수 있다
- 시스템 프롬프트, 첨부, 외부 컨텍스트, reference media가 prompt type에 맞춰 자연스럽게 노출된다
- sticky action bar에서 생성 가능 여부가 즉시 반영된다

---

## 6. [FE] 프롬프트 편집 화면 변경 요약 및 저장 흐름 개편

**선행 작업:** 2번 티켓

**작업 내용**

- 설계 문서 `docs/operational-console-screen-plan.md` 6.5 참고
- 설계 문서 `docs/operational-console-wireframes.md` 8장 참고
- `src/pages/PromptEditPage.tsx` 상단에 `프롬프트명`, `소속 배치`, `현재 상태`를 명확히 노출
- 편집 폼과 별도로 `Change Summary Panel` 추가
- `promptType`, `attachment changed`, `reference media`, `save readiness`를 요약해 노출
- 첨부 변경 시 prompt 재생성 가능성을 별도 notice로 표기
- 하단 저장 액션을 sticky action bar 또는 동등한 구조로 고정
- 편집 불가 조건을 진입 시 메시지로 명확하게 정리

**API 명세**

- 조회 URL:
  - `GET /batches/{batchId}`
  - `GET /batches/{batchId}/prompts/{promptId}`
  - `GET /models`
- 수정 URL: `PUT /batches/{batchId}/prompts/{promptId}`
- 첨부 변경 후 재생성 경로:
  - `POST /batches/{batchId}/prompts`
  - `DELETE /batches/{batchId}/prompts/{promptId}`

- `PUT /batches/{batchId}/prompts/{promptId}` 요청 예시:

```json
{
  "label": "Prompt A revised",
  "systemPrompt": "You are a concise assistant.",
  "userPrompt": "Summarize the release notes in 5 bullets",
  "attachments": [],
  "promptType": "TEXT"
}
```

- 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 101,
    "label": "Prompt A revised",
    "userPrompt": "Summarize the release notes in 5 bullets",
    "status": "PENDING",
    "promptType": "TEXT"
  }
}
```

- 에러 코드 케이스:
  - `PROMPT_NOT_FOUND`
  - `BATCH_NOT_EDITABLE`
  - `INVALID_REQUEST`
  - `NETWORK_ERROR`

**완료 조건**

- 사용자가 편집 대상과 상위 배치 맥락을 상단에서 바로 파악할 수 있다
- 첨부 변경 여부와 재생성 가능성이 저장 전 명확히 보인다
- 저장 가능 여부가 변경 요약과 함께 실시간 반영된다
- 편집 불가 상태에서는 폼 진입보다 명확한 안내가 먼저 보인다

---

## 7. [FE] 프롬프트 상세 화면 문서형 뷰어 레이아웃 개편

**선행 작업:** 2번 티켓

**작업 내용**

- 설계 문서 `docs/operational-console-screen-plan.md` 6.4 참고
- 설계 문서 `docs/operational-console-wireframes.md` 7장 참고
- `src/pages/PromptDetailPage.tsx`를 `Content Viewer + Meta Sidebar` 2열 구조로 재구성
- `user prompt`, `model answer`, `attachments`, `error`를 문서형 흐름으로 재배치
- markdown/text 전환을 segmented control 또는 동등한 간결 구조로 정리
- 출력 결과가 입력보다 더 쉽게 읽히도록 시각 우선순위 조정
- media 결과와 text 결과의 viewer 구조를 통일된 패턴으로 정리
- Draft 상태의 수정/삭제 가능 조건을 상단 action 그룹에서 즉시 식별 가능하게 정리

**API 명세**

- 조회 URL:
  - `GET /batches/{batchId}/prompts/{promptId}`
  - `GET /batches/{batchId}`
- 삭제 URL: `DELETE /batches/{batchId}/prompts/{promptId}`

- 응답 예시:

```json
{
  "success": true,
  "data": {
    "id": 101,
    "label": "Prompt A",
    "systemPrompt": "You are a concise assistant.",
    "userPrompt": "Summarize release notes",
    "attachments": [
      {
        "fileName": "release.txt",
        "fileContent": "..."
      }
    ],
    "status": "COMPLETED",
    "responseContent": "1. ...",
    "promptType": "TEXT"
  }
}
```

- 에러 코드 케이스:
  - `PROMPT_NOT_FOUND`
  - `BATCH_NOT_FOUND`
  - `BATCH_RESULT_NOT_FOUND`
  - `NETWORK_ERROR`

**완료 조건**

- 단일 프롬프트 입력/출력 검토가 문서 읽기 경험처럼 동작한다
- 메타 정보와 본문 정보가 서로 다른 역할로 분리된다
- 완료, 실패, 대기, 미디어 결과 상태가 각기 명확하게 구분된다
- Draft 상태의 수정/삭제 액션이 상단에서 조건부로 정확히 노출된다

---

## 8. [FE] 템플릿 화면 split-view 자산 관리 구조 개편

**선행 작업:** 2번 티켓

**작업 내용**

- 설계 문서 `docs/operational-console-screen-plan.md` 6.6 참고
- 설계 문서 `docs/operational-console-wireframes.md` 9장 참고
- `src/pages/TemplatesPage.tsx`를 카드 목록 중심 구조에서 `목록 + preview` split-view 구조로 재구성
- 템플릿 목록에서 `이름`, `설명`, `최근 수정일`, `system prompt 유무`를 우선 노출
- 우측 preview에서 선택한 템플릿의 `system prompt`, `user prompt`, 설명을 충분히 읽을 수 있게 구성
- 생성/수정 경험은 가능하면 side panel 또는 inline editor 우선 검토
- 삭제 액션보다 템플릿의 재사용 가치가 먼저 드러나도록 액션 위계 재정렬

**API 명세**

- 조회 URL: `GET /templates`
- 생성 URL: `POST /templates`
- 수정 URL: `PUT /templates/{id}`
- 삭제 URL: `DELETE /templates/{id}`

- `GET /templates` 응답 예시:

```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "name": "Release Summary",
      "description": "릴리즈 노트 요약용 템플릿",
      "systemPrompt": "You are a concise assistant.",
      "userPrompt": "Summarize release notes in bullet points.",
      "createdAt": "2026-04-10T09:00:00Z",
      "updatedAt": "2026-04-16T18:20:00Z"
    }
  ]
}
```

- `POST /templates` 요청 예시:

```json
{
  "name": "Release Summary",
  "description": "릴리즈 노트 요약용 템플릿",
  "systemPrompt": "You are a concise assistant.",
  "userPrompt": "Summarize release notes in bullet points."
}
```

- 에러 코드 케이스:
  - `INVALID_REQUEST`
  - `NETWORK_ERROR`
  - `INTERNAL_SERVER_ERROR`

**완료 조건**

- 템플릿 목록과 preview가 동시에 보이는 구조가 적용된다
- 선택한 템플릿 내용을 수정 전에도 충분히 읽을 수 있다
- 생성/수정/삭제 액션 위계가 재사용 가치보다 앞서 보이지 않는다
- 모바일에서 목록 우선 흐름으로 자연스럽게 축약된다

---

## 추천 생성 순서

1. `[FE] 운영 콘솔 전역 토큰 및 테마 재정의`
2. `[FE] 운영 콘솔 공통 앱 셸 및 페이지 헤더 패턴 적용`
3. `[FE] 배치 목록 화면 운영형 리스트 레이아웃 개편`
4. `[FE] 배치 상세 화면 상태판 및 작업면 구조 개편`
5. `[FE] 배치 생성 화면 2단계 작성 흐름 개편`
6. `[FE] 프롬프트 편집 화면 변경 요약 및 저장 흐름 개편`
7. `[FE] 프롬프트 상세 화면 문서형 뷰어 레이아웃 개편`
8. `[FE] 템플릿 화면 split-view 자산 관리 구조 개편`

## 참고 문서

- `docs/operational-console-screen-plan.md`
- `docs/operational-console-wireframes.md`
- `docs/operational-console-system-spec.md`
- `docs/operational-console-roadmap.md`
