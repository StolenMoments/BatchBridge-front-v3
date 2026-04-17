# BatchBridge 화면 와이어프레임 제안

## 1. 문서 목적

이 문서는 `operational-console-screen-plan.md`를 기준으로 실제 화면 구조를 빠르게 합의하기 위한 저해상도 와이어프레임 문서다. 시각 스타일보다 정보 배치, 읽기 순서, 액션 위치, 반응형 전환 규칙을 우선 정의한다.

본 문서의 ASCII 레이아웃은 특정 프레임워크나 CSS 구현을 강제하지 않는다. 핵심은 정보 구조와 영역 역할이다.

## 2. 공통 표기 규칙

- `[]`는 버튼 또는 선택 가능한 제어 요소
- `()`는 상태 또는 메타 라벨
- `----`는 구획 분리
- 좌우 열 구조는 데스크톱 기준이며, 태블릿/모바일에서는 세로 스택으로 전환 가능

## 3. 공통 페이지 프레임

```text
+----------------------------------------------------------------------------------+
| Global Header                                                                    |
| Brand | Primary Nav | Locale | Theme                                             |
+----------------------------------------------------------------------------------+
| Page Header                                                                       |
| Title + Description                                  [Primary Action] [Secondary] |
+----------------------------------------------------------------------------------+
| Context Strip / Toolbar / Meta Strip                                             |
+----------------------------------------------------------------------------------+
| Main Content                                                                      |
|                                                                                   |
+----------------------------------------------------------------------------------+
| Footer                                                                            |
+----------------------------------------------------------------------------------+
```

### 공통 규칙

- Page Header는 본문과 시각적으로 분리되어야 한다
- Context Strip은 페이지의 현재 상태나 조작 문맥을 요약해야 한다
- Main Content는 한 화면에서 하나의 핵심 작업만 중심에 둔다

---

## 4. Batch List

### 4.1 데스크톱 와이어프레임

```text
+----------------------------------------------------------------------------------+
| Batch List                                                                        |
| Manage and review async jobs efficiently                  [Refresh] [New Batch]   |
+----------------------------------------------------------------------------------+
| Summary Strip                                                                     |
| Total 128 | In Progress 12 | Failed 4 | Completed 96 | Last Sync 14:32           |
+----------------------------------------------------------------------------------+
| Toolbar                                                                           |
| [All] [Draft] [In Progress] [Completed] [Failed]   Page Size [ 9 v ]             |
+----------------------------------------------------------------------------------+
| List Header                                                                       |
| Batch / Model                 Status / Counts            Created At      Actions   |
+----------------------------------------------------------------------------------+
| Batch A                        (In Progress) 48 prompts   2026-04-17     [Open]    |
| claude-sonnet                  success 31 / failed 2      14:05                    |
|----------------------------------------------------------------------------------|
| Batch B                        (Draft) 3 prompts          2026-04-17     [Open]    |
| gemini-2.5                     not submitted yet          12:40           [Delete]  |
|----------------------------------------------------------------------------------|
| Batch C                        (Failed) 10 prompts        2026-04-16     [Open]    |
| grok-4                         success 7 / failed 3       23:10                    |
+----------------------------------------------------------------------------------+
| Pagination                                                                       |
| [Prev] 1 2 3 4 [Next]                                                             |
+----------------------------------------------------------------------------------+
```

### 4.2 모바일 와이어프레임

```text
+--------------------------------------+
| Batch List                           |
| [New Batch]                          |
+--------------------------------------+
| Total 128 | In Progress 12           |
| Failed 4 | Last Sync 14:32           |
+--------------------------------------+
| [All] [Draft] [In Progress]          |
| [Completed] [Failed]                 |
| Page Size [9v]       [Refresh]       |
+--------------------------------------+
| Batch A                              |
| claude-sonnet                        |
| (In Progress) 48 prompts             |
| success 31 / failed 2                |
| 2026-04-17 14:05            [Open]   |
|--------------------------------------|
| Batch B                              |
| gemini-2.5                           |
| (Draft) 3 prompts                    |
| 2026-04-17 12:40  [Open] [Delete]    |
+--------------------------------------+
```

### 4.3 구조 메모

- 요약 메타 스트립은 필터 툴바보다 먼저 온다
- 목록 헤더는 고정 가능하되 모바일에서는 제거 가능하다
- 기본 단위는 카드가 아니라 행이다

---

## 5. Batch Create

### 5.1 데스크톱 와이어프레임

```text
+----------------------------------------------------------------------------------+
| New Batch                                                                        |
| Prepare a batch and its first prompt                         [Cancel] [Create]    |
+----------------------------------------------------------------------------------+
| Step Strip                                                                        |
| Step 1 Batch Setup ------------------------ Step 2 First Prompt ----------------- |
+----------------------------------------------------------+-----------------------+
| Main Form                                                | Summary Panel         |
|                                                          |-----------------------|
| Step 1. Batch Setup                                      | Model                 |
| Model [ select ]                                         | Prompt Type           |
| Batch Label [________________________]                   | Attachments           |
|                                                          | Readiness             |
|----------------------------------------------------------|-----------------------|
| Step 2. First Prompt                                     | Notes                 |
| Prompt Label [____________________]                      | Optional system text  |
| Prompt Type [ select ]                                   | Edit media required   |
|                                                          | External context cnt  |
| Optional System Instruction [expand/collapse]            |                       |
| User Prompt                                              |                       |
| [textarea............................................]   |                       |
|                                                          |                       |
| External Context / Attachments                           |                       |
| [import area]                                            |                       |
| [attachment area]                                        |                       |
|                                                          |                       |
| Reference Media (only for edit type)                     |                       |
| [url / media slot]                                       |                       |
+----------------------------------------------------------+-----------------------+
| Sticky Action Bar                                                                |
| Validation summary                                    [Cancel] [Create Batch]    |
+----------------------------------------------------------------------------------+
```

### 5.2 모바일 와이어프레임

```text
+--------------------------------------+
| New Batch                            |
| [Back]                    [Create]   |
+--------------------------------------+
| Step 1. Batch Setup                  |
| Model [select]                       |
| Batch Label                          |
|--------------------------------------|
| Step 2. First Prompt                 |
| Prompt Label                         |
| Prompt Type                          |
| Optional System Instruction          |
| User Prompt                          |
| [textarea.................]          |
|--------------------------------------|
| External Context / Attachments       |
| [import area]                        |
| [attachment area]                    |
|--------------------------------------|
| Summary                              |
| Model / Type / Attachments / Ready   |
+--------------------------------------+
| Sticky Footer                        |
| [Cancel]            [Create Batch]   |
+--------------------------------------+
```

### 5.3 구조 메모

- Summary Panel은 데스크톱에서 우측 고정, 모바일에서 본문 하단 요약 블록으로 이동한다
- 시스템 프롬프트는 collapse 가능하되 닫힌 상태에서도 값 존재 여부가 보여야 한다

---

## 6. Batch Detail

### 6.1 Draft 상태 데스크톱 와이어프레임

```text
+----------------------------------------------------------------------------------+
| Batch Name                                                     (Draft)           |
| Model claude-sonnet | Created 14:05 | Not Submitted   [Edit] [Delete] [Submit]  |
+----------------------------------------------------------------------------------+
| Meta Strip                                                                        |
| 3 prompts | 2 attachments used | ready to submit                                  |
+-----------------------------------------------+----------------------------------+
| Prompt List                                    | Add Prompt Composer              |
|-----------------------------------------------|----------------------------------|
| #1 Prompt A   (Text)   attach 2   preview...  | Label [____________________]     |
| [Open] [Delete]                                | Type [ select ]                  |
|-----------------------------------------------| Optional System Instruction      |
| #2 Prompt B   (Image Edit) media   preview... | [textarea....................]   |
| [Open] [Delete]                                | User Prompt                      |
|-----------------------------------------------| [textarea....................]   |
| Empty row if no prompts                        | Attachments / Context            |
|                                                | [import area]                    |
|                                                | [attachment area]                |
|                                                | [Add Prompt]                     |
+-----------------------------------------------+----------------------------------+
```

### 6.2 Completed / Failed 상태 데스크톱 와이어프레임

```text
+----------------------------------------------------------------------------------+
| Batch Name                                                 (Completed)           |
| Model claude-sonnet | Created 14:05 | Submitted 14:10 | Completed 14:32         |
|                                                     [Sync] [Resync Failed Only] |
+----------------------------------------------------------------------------------+
| Batch Level Notice / Error                                                        |
| If needed, show batch-wide API error or resync guidance                           |
+----------------------------------------------------------------------------------+
| Prompt Sections                                                                    |
|----------------------------------------------------------------------------------|
| Prompt A                              (Completed) (Text)          result yes      |
| preview of user prompt...                                                     [v] |
|----------------------------------------------------------------------------------|
| Input                                                                            |
| [prompt content viewer]                                                           |
| Attachments                                                                       |
| [attachment list]                                                                 |
| Result                                                                            |
| [response viewer]                                                                 |
|----------------------------------------------------------------------------------|
| Prompt B                              (Failed) (Image Edit)     result no         |
| reference media present                                                        [v] |
|----------------------------------------------------------------------------------|
| Error                                                                             |
| [failed reason block]                                                             |
+----------------------------------------------------------------------------------+
```

### 6.3 모바일 와이어프레임

```text
+--------------------------------------+
| Batch Name                 (Draft)   |
| Model claude-sonnet                  |
| Created 14:05                        |
| [Submit] [Edit] [Delete]            |
+--------------------------------------+
| 3 prompts | ready to submit          |
+--------------------------------------+
| Prompt List                          |
| #1 Prompt A (Text) attach 2          |
| preview...                   [Open]  |
| #2 Prompt B (Image Edit)     [Open]  |
+--------------------------------------+
| Add Prompt                           |
| Label                                |
| Type                                 |
| System                               |
| User Prompt                          |
| Attachments                          |
| [Add Prompt]                         |
+--------------------------------------+
```

### 6.4 구조 메모

- 상단 메타와 액션은 한 덩어리가 아니라 좌우로 분리한다
- Draft 상태에서는 작성 도구와 목록을 동시에 다룬다
- Completed 이후에는 섹션 스택 구조가 우선이다

---

## 7. Prompt Detail

### 7.1 데스크톱 와이어프레임

```text
+----------------------------------------------------------------------------------+
| Prompt Name                                              (Completed) (Text)      |
| In Batch: Batch Name                                                        [Edit]|
+----------------------------------------------------------+-----------------------+
| Content Viewer                                            | Meta Sidebar         |
|----------------------------------------------------------|-----------------------|
| Segmented Control [Markdown] [Text]                      | Status               |
|                                                          | Type                 |
| User Prompt                                              | Attachment Count     |
| [viewer..............................................]   | Batch Link           |
|                                                          | Created / Updated    |
|----------------------------------------------------------| Actions              |
| Model Answer                                             | [Edit] [Delete]      |
| [viewer..............................................]   |                       |
|                                                          |                       |
|----------------------------------------------------------|                       |
| Attachments                                              |                       |
| [attachment list / file detail]                          |                       |
+----------------------------------------------------------+-----------------------+
```

### 7.2 실패 상태 와이어프레임

```text
+----------------------------------------------------------------------------------+
| Prompt Name                                                (Failed)              |
+----------------------------------------------------------+-----------------------+
| Content Viewer                                            | Meta Sidebar         |
| User Prompt                                               | Status / Type        |
| [viewer]                                                  | Batch Link           |
|----------------------------------------------------------|-----------------------|
| Failure Details                                           |                       |
| [error block with cause and retry context]                |                       |
+----------------------------------------------------------+-----------------------+
```

### 7.3 모바일 와이어프레임

```text
+--------------------------------------+
| Prompt Name                          |
| (Completed) (Text)                   |
| In Batch: Batch Name                 |
+--------------------------------------+
| Meta                                 |
| Status / Type / Attachments          |
| [Edit] [Delete]                      |
+--------------------------------------+
| User Prompt                          |
| [viewer]                             |
|--------------------------------------|
| Model Answer                         |
| [viewer]                             |
|--------------------------------------|
| Attachments                          |
| [list]                               |
+--------------------------------------+
```

---

## 8. Prompt Edit

### 8.1 데스크톱 와이어프레임

```text
+----------------------------------------------------------------------------------+
| Edit Prompt                                                                       |
| Prompt Name | In Batch Batch Name | Draft / Pending                 [Save]        |
+----------------------------------------------------------+-----------------------+
| Edit Form                                                 | Change Summary       |
|----------------------------------------------------------|-----------------------|
| Label [________________________]                         | Prompt Type          |
| Type [ select ]                                          | Attachment Changed   |
| System Prompt                                            | Reference Media      |
| [textarea............................................]   | Save Readiness       |
| User Prompt                                              | Side Effects         |
| [textarea............................................]   | if recreate needed   |
| Attachments / External Context                           |                       |
| [import area]                                            |                       |
| [attachment area]                                        |                       |
| Reference Media                                          |                       |
| [url / slot]                                             |                       |
+----------------------------------------------------------+-----------------------+
| Sticky Action Bar                                                                |
| Change notice                                          [Cancel] [Save Changes]   |
+----------------------------------------------------------------------------------+
```

### 8.2 구조 메모

- 변경 요약은 편집과 동시에 갱신되어야 한다
- 첨부 변경 시 프롬프트 재생성 가능성을 별도 라인으로 노출한다

---

## 9. Templates

### 9.1 데스크톱 와이어프레임

```text
+----------------------------------------------------------------------------------+
| Templates                                                     [New Template]     |
| Reusable starting points for prompt authoring                                     |
+-----------------------------------------------+----------------------------------+
| Template List                                  | Preview / Editor                 |
|-----------------------------------------------|----------------------------------|
| Template A                                     | Name                             |
| description...                                 | Description                      |
| updated 2026-04-16                             |----------------------------------|
|-----------------------------------------------| System Prompt                    |
| Template B                                     | [viewer........................] |
| description...                                 |----------------------------------|
| updated 2026-04-15                             | User Prompt                      |
|-----------------------------------------------| [viewer........................] |
| Empty state if none                            |----------------------------------|
|                                                | [Edit] [Duplicate] [Delete]      |
+-----------------------------------------------+----------------------------------+
```

### 9.2 생성/수정 패널

```text
+--------------------------------------+
| Template Editor                      |
| Name                                 |
| Description                          |
| Optional System Prompt               |
| User Prompt                          |
|                         [Save]       |
+--------------------------------------+
```

### 9.3 모바일 와이어프레임

```text
+--------------------------------------+
| Templates                [New]       |
+--------------------------------------+
| Template A                            |
| description...                        |
| updated 2026-04-16            [Open]  |
|--------------------------------------|
| Template B                            |
| description...                [Open]  |
+--------------------------------------+
| Selected Template                     |
| Name / Description                    |
| System Prompt                         |
| User Prompt                           |
| [Edit] [Delete]                       |
+--------------------------------------+
```

---

## 10. 전환 규칙 요약

### 10.1 데스크톱에서 태블릿

- split-pane는 세로 스택으로 전환 가능하다
- sticky side panel은 상단 요약 블록 또는 하단 액션 블록으로 재배치한다
- 메타 스트립은 두 줄까지 허용한다

### 10.2 태블릿에서 모바일

- 목록 비교 정보는 2행 또는 3행 정보 블록으로 축약한다
- 헤더의 보조 액션은 overflow 또는 2행 배치가 가능하다
- 목록의 부가 메타는 숨기지 말고 재배열한다

## 11. 구현 메모

- 와이어프레임은 시각 스타일의 최종안이 아니라 정보 구조 기준안이다
- 구현 단계에서는 각 페이지에서 "무엇을 먼저 읽게 할 것인가"를 유지해야 한다
- 본 문서는 이후 하이파이 디자인, 실제 컴포넌트 추출, 반응형 기준 수립의 기초 문서로 사용한다
