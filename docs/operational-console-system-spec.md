# BatchBridge 전역 UI 시스템 스펙

## 1. 문서 목적

이 문서는 운영 콘솔 개편을 위한 전역 UI 시스템 기준서다. 특정 CSS 변수명이나 컴포넌트 구현체를 강제하지 않고, 어떤 FE 기술로 구현하더라도 유지되어야 할 토큰 체계, 레이아웃 언어, 컴포넌트 역할을 정의한다.

## 2. 시스템 목표

- 제품 전체를 하나의 운영 콘솔 언어로 통일한다
- 정보 밀도가 높은 화면에서도 읽기 피로를 낮춘다
- 브랜드 green과 상태색을 구조적으로 분리한다
- 카드 중심 구조에서 strip, row, split-pane 중심 구조로 전환한다

## 3. 토큰 체계

## 3.1 색상 토큰 역할

색상은 "브랜드", "상태", "표면", "텍스트", "보더"의 다섯 축으로 분리한다.

### 브랜드 축

- primary: 주요 액션, 활성 선택, 핵심 링크
- primary-muted: 은은한 선택 배경, active row hover
- primary-strong: 강조 버튼, 핵심 CTA

### 상태 축

- success
- danger
- warning
- progress
- neutral-status

### 표면 축

- app background
- elevated surface
- inset surface
- muted surface
- interactive hover surface

### 텍스트 축

- strong text
- default text
- muted text
- inverse text

### 보더 축

- default border
- strong border
- subtle divider
- active border

## 3.2 컬러 운영 원칙

- 모든 neutral은 brand hue에 약하게 틴트되어야 한다
- brand green은 긍정 상태를 대신하지 않는다
- danger는 삭제와 실패에만 사용한다
- progress는 in-progress를 위한 별도 톤을 사용한다
- completed status는 success 축을 사용하되, primary와 혼동되지 않아야 한다

## 3.3 라이트/다크 모드 원칙

- 두 모드 모두 지원하되, 동일한 정보 계층이 유지되어야 한다
- 다크 모드에서 과한 네온, 과한 글로우, 과한 블루/퍼플 편향은 금지한다
- 라이트 모드에서는 pure white 배경 대신 약한 tinted surface를 기본 배경으로 사용한다

## 4. 타이포그래피 시스템

## 4.1 역할 분리

- Display / Brand Typeface: 브랜드명, 대제목, 주요 구획 제목
- Body Typeface: 본문, 메타 정보, 폼, 리스트

## 4.2 위계 규칙

- Page Title: 화면 진입 즉시 읽히는 가장 큰 레벨
- Section Title: 본문 내 작업 구획 제목
- Row Title: 배치명, 프롬프트명, 템플릿명
- Meta Label: 상태, 시간, 보조 정보
- Control Text: 버튼, 탭, 세그먼트, 입력 라벨

## 4.3 적용 원칙

- 운영 화면은 과도한 fluid type보다 고정 기반 scale을 우선한다
- 메타 정보는 너무 작아지지 않아야 한다
- 제목은 줄 수를 짧게 유지하고, 설명은 1줄 또는 2줄을 넘기지 않도록 한다

## 5. 공간 시스템

## 5.1 spacing scale

권장 spacing step은 4pt 기반으로 구성한다.

- 4
- 8
- 12
- 16
- 24
- 32
- 48
- 64
- 96

## 5.2 공간 운영 원칙

- 같은 레벨의 요소는 `gap` 기반으로 묶는다
- 정보 블록 간격은 균일하지 않아야 한다
- 제목 위/아래 간격은 위계에 따라 차등 적용한다
- 리스트는 세로 밀도를 높이되 답답해 보이지 않게 행 내부 좌우 호흡을 확보한다

## 6. 레이아웃 시스템

## 6.1 공통 레이아웃 타입

### App Shell

- sticky global header
- centered content container
- restrained footer

### Page Header

- title block
- description
- primary action
- optional secondary controls

### Meta Strip

- 상태, 모델, 시간, 개수 같은 요약 정보를 압축 배치하는 수평 영역

### Toolbar

- 필터, 정렬, 페이지 크기, 새로고침 등의 운영 제어 영역

### Row List

- 목록 비교와 빠른 탐색을 위한 기본 구조

### Split Pane

- 작성/요약, 목록/미리보기, 문서/메타를 동시에 다루는 구조

### Section Stack

- 상세 정보와 결과를 세로 흐름으로 읽는 구조

## 6.2 페이지별 우선 레이아웃 타입

- Batch List: Meta Strip + Toolbar + Row List
- Batch Create: Step Sections + Split Pane + Sticky Action Bar
- Batch Detail Draft: Meta Strip + Action Group + Split Pane
- Batch Detail Completed: Meta Strip + Section Stack
- Prompt Detail: Split Pane
- Prompt Edit: Split Pane + Sticky Action Bar
- Templates: Split Pane

## 6.3 반응형 전환 규칙

- split-pane는 모바일에서 상하 스택으로 전환한다
- sticky panel은 모바일에서 일반 section으로 전환한다
- row list는 모바일에서 2행 또는 3행 compressed row로 변환한다
- action group은 overflow menu보다 2행 정렬을 먼저 검토한다

## 7. 컴포넌트 역할 정의

## 7.1 Page Header

### 포함 요소

- 제목
- 짧은 설명
- primary action
- secondary actions 또는 filters

### 금지 요소

- 과도한 소개 문단
- 불필요한 아이콘 장식

## 7.2 Status Badge

### 역할

- 현재 상태를 짧고 빠르게 식별한다

### 원칙

- 텍스트 없이 아이콘만 두지 않는다
- 상태 badge는 액션 버튼보다 약간 낮은 강조도를 가진다

## 7.3 Meta Item

### 역할

- 모델, 시간, 개수, 연결 정보 등 보조 정보를 일관되게 표시한다

### 원칙

- 메타 아이템은 문장보다 label-value 구조가 읽기 쉽다
- 한 줄에 너무 많이 넣지 말고 필요한 경우 줄바꿈을 허용한다

## 7.4 Toolbar

### 역할

- 화면의 현재 뷰를 조작한다

### 원칙

- 보기 전환과 데이터 조작을 구분한다
- 새로고침, 필터, 페이지 사이즈는 함께 두되 destructive action은 두지 않는다

## 7.5 Row List Item

### 포함 요소

- 식별 정보
- 상태
- 수량 또는 진행 정보
- 시간
- 행 액션

### 원칙

- hover는 선택 가능성만 전달한다
- 중요한 값은 행 내부 좌측부터 우선순위 순으로 읽히게 한다

## 7.6 Summary Panel

### 역할

- 작성 또는 선택 상태를 짧게 요약한다

### 적용 화면

- Batch Create
- Prompt Edit
- Templates

## 7.7 Viewer Pane

### 역할

- 입력 본문, 결과 본문, 시스템 프롬프트, 첨부 내용 등 읽기 중심 정보를 표현한다

### 원칙

- 입력과 결과의 시각적 톤을 동일하게 두지 않는다
- 스크롤 영역이 생길 경우 제목과 도구는 고정하고 본문만 스크롤할 수 있다

## 8. 상태 표현 시스템

## 8.1 배치 상태

- Draft: 편집 가능, 제출 전
- In Progress: 외부 처리 진행 중
- Completed: 완료
- Failed: 배치 수준 실패

## 8.2 프롬프트 상태

- Pending: 결과 대기
- Completed: 결과 확인 가능
- Failed: 실패 원인 확인 필요
- Draft 문맥에서의 Prompt는 상위 Batch 상태를 우선 인지하게 한다

## 8.3 상태 노출 위치

- Page Header 또는 Meta Strip
- Row List Item
- Section Header
- Sidebar Meta

같은 상태를 한 화면에서 반복 남용하지 않는다.

## 9. 상호작용 시스템

## 9.1 액션 위계

- Primary: 현재 화면의 핵심 완료 액션
- Secondary: 보조 작업 또는 문맥 유지 액션
- Tertiary: 링크 수준 이동
- Destructive: 삭제 등 위험 동작

## 9.2 피드백 원칙

- 로컬 busy state를 우선 적용한다
- 성공 피드백은 짧고 즉시 닫혀도 되는 수준으로 유지한다
- 실패 피드백은 원인과 다음 행동 단서를 같이 제공한다

## 9.3 progressive disclosure

- 시스템 프롬프트
- 첨부 상세 내용
- 실패 세부 정보
- 결과 상세 표현

위 항목들은 기본 정보 구조를 흐리지 않는 선에서 단계적으로 펼친다.

## 10. 모션 시스템

## 10.1 허용 범위

- hover state
- accordion expand/collapse
- refresh spinner
- section reveal
- sticky bar 진입/이탈

## 10.2 금지 방향

- 의미 없는 장식성 패럴랙스
- 네온 글로우 기반 강조
- bounce 계열 easing
- 결과 영역에 대한 과도한 등장 애니메이션

## 11. 접근성 및 국제화

## 11.1 접근성

- 색 외에 텍스트와 아이콘으로 상태를 구분한다
- 키보드 포커스는 시각적으로 분명해야 한다
- split-pane에서도 읽기 순서가 DOM 순서와 크게 어긋나지 않아야 한다

## 11.2 국제화

- 한국어와 영어 모두에서 버튼 폭이 유지되어야 한다
- 긴 모델명, 긴 프롬프트명은 말줄임 처리하되 전체 보기 경로를 제공한다
- 날짜/시간 형식은 locale 전략에 맞게 교체 가능해야 한다

## 12. 구현 체크리스트

- 페이지 헤더 패턴이 공통화되었는가
- row list와 card의 역할 분리가 이루어졌는가
- sticky panel이 모바일에서 무리 없이 재배치되는가
- 상태 badge가 brand primary와 혼동되지 않는가
- 결과 viewer가 입력 viewer보다 읽기 쉬운가

## 13. 권장 후속 문서

- 실제 토큰 명세서
- 컴포넌트 API 설계서
- 반응형 breakpoint 가이드
- 화면별 콘텐츠/카피 가이드
