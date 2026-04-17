# BatchBridge 운영 콘솔 개편 로드맵

## 1. 문서 목적

이 문서는 화면 기획서와 와이어프레임 문서를 실제 구현 순서로 전환하기 위한 실행 계획서다. 목표는 API를 바꾸지 않고 프런트엔드 구조, 표현, 컴포넌트 언어를 단계적으로 개선하는 것이다.

## 2. 전체 전략

개편은 세 단계로 나눈다.

1. 전역 기반 정비
2. 핵심 운영 화면 재구성
3. 상세 뷰와 자산 관리 화면 고도화

이 순서는 시각적 완성도보다 체감 효율을 먼저 끌어올리기 위한 순서다.

## 3. 우선순위 원칙

- 사용 빈도가 높은 화면부터 개선한다
- 구조적 재사용성이 높은 전역 규칙을 먼저 만든다
- 한 번에 전 페이지를 손대지 말고, 공통 프레임을 만든 뒤 화면에 적용한다
- 개편 단계마다 사용성 개선 효과를 독립적으로 체감할 수 있어야 한다

## 4. 단계별 로드맵

## 4.1 Phase 1. Foundation

### 목표

- 전역 디자인 토큰 재정비
- 앱 셸 및 페이지 헤더 패턴 통일
- 레이아웃 언어의 기준선 확보

### 범위

- 색상 토큰
- 타이포그래피 토큰
- spacing/token 체계
- 글로벌 헤더/푸터
- 페이지 헤더 패턴
- 공통 툴바, 메타 스트립, 상태 배지 규칙

### 산출물

- 토큰 정의 문서
- 공통 레이아웃 규칙
- 상태/배지 사용 기준
- 샘플 페이지 헤더 컴포지션

### 성공 기준

- 새로운 페이지를 만들 때 헤더/본문/액션 구조를 공통 패턴으로 조립할 수 있다
- green anchor와 상태색 역할이 분리된다
- 카드 중심의 현재 어조에서 벗어난다

### 리스크

- 전역 스타일을 먼저 바꿀 경우 기존 페이지가 일시적으로 어정쩡해질 수 있다
- typography 변경 시 한글/영문 혼합에서 줄바꿈이 달라질 수 있다

## 4.2 Phase 2. Batch Workflow Core

### 목표

- 가장 자주 쓰는 운영 흐름인 배치 생성, 목록 확인, 상세 검토를 재구성한다

### 범위

- Batch List
- Batch Detail
- Batch Create
- Prompt Edit

### 우선 적용 순서

1. Batch List
2. Batch Detail
3. Batch Create
4. Prompt Edit

### 이유

- Batch List는 개편 체감이 가장 크다
- Batch Detail은 제품 핵심 운영 화면이다
- Batch Create와 Prompt Edit는 작성 경험을 안정시키는 역할을 한다

### 성공 기준

- Batch List에서 카드 그리드 의존도를 제거한다
- Batch Detail에서 배치 상태와 프롬프트 상태가 명확히 분리된다
- 작성/편집 화면에서 사용자가 현재 준비 상태를 바로 이해할 수 있다

### 리스크

- Batch Detail의 Draft와 Completed 구조가 달라 구현 복잡도가 높다
- Prompt Edit의 첨부 변경 로직은 UI 설계와 실제 동작 안내가 어긋나기 쉽다

## 4.3 Phase 3. Reading & Reuse

### 목표

- 결과 검토와 재사용 자산 관리 경험을 정교화한다

### 범위

- Prompt Detail
- Templates

### 성공 기준

- Prompt Detail이 문서형 viewer처럼 읽힌다
- Templates가 단순 CRUD 목록이 아니라 재사용 출발점처럼 보인다

### 리스크

- split-view는 모바일 적응 방식이 미리 정의되지 않으면 혼란스러울 수 있다
- 템플릿 preview와 editor를 동시에 다룰 때 정보량 제어가 필요하다

## 5. 작업 단위 제안

## 5.1 Epic 단위

### Epic A. Global Console Foundation

- 앱 셸 재구성
- 페이지 헤더 표준화
- 토큰 정비
- 상태 표현 시스템 정비

### Epic B. Batch Operations

- Batch List 정보 밀도 개편
- Batch Detail 메타 스트립 및 섹션 구조화
- 배치 액션 그룹 재배치

### Epic C. Authoring Experience

- Batch Create 2-step 구조
- Prompt Edit 변경 요약 패널
- sticky action bar 도입

### Epic D. Reading Experience

- Prompt Detail viewer 레이아웃
- 실패/대기/완료 상태별 결과 표현 통일

### Epic E. Reusable Assets

- Templates split-view
- side panel 또는 inline editor 도입

## 5.2 Ticket 단위 예시

### Foundation

- 토큰 네이밍 재정의
- 공통 페이지 헤더 컴포넌트 설계
- 공통 메타 스트립 컴포넌트 설계
- 상태 배지/상태 라벨 스타일 정리

### Batch List

- 요약 스트립 추가
- 필터 툴바 재배치
- row list 구조로 변경
- 모바일 목록 압축 레이아웃 정의

### Batch Detail

- 배치 헤더를 메타 스트립 + 액션 그룹으로 분리
- Draft prompt list 구조 재작성
- Completed prompt section stack 구조 정리
- batch-level error zone 분리

### Batch Create

- 2-step visual structure 도입
- summary panel 도입
- sticky footer action bar 도입

### Prompt Edit

- 편집 헤더 맥락 강화
- change summary 패널 추가
- attachment side effect notice 추가

### Prompt Detail

- 2-column viewer 구조 도입
- meta sidebar 정리
- 결과 영역 시각 우선순위 상향

### Templates

- list + preview split-view
- preview 우선 구조 도입
- modal 의존도 축소

## 6. 의존성 맵

## 6.1 선행 의존성

- Batch List, Batch Detail, Batch Create, Prompt Edit는 전역 토큰 및 페이지 헤더 정의 이후 착수하는 것이 안전하다
- Prompt Detail과 Templates는 split-pane 및 viewer 패턴이 먼저 정의되면 구현 효율이 높다

## 6.2 병렬 가능 영역

- 토큰 정비와 와이어프레임 고도화는 병렬 가능
- Batch Create와 Prompt Edit는 공통 작성 패턴을 공유하므로 같은 스프린트에서 진행 가능
- Prompt Detail과 Templates는 핵심 배치 흐름 이후 병렬 진행 가능

## 7. 검수 체크리스트

각 단계 종료 시 아래 질문을 기준으로 검수한다.

### Foundation

- 전역 화면이 generic admin처럼 보이지 않는가
- 페이지 헤더 패턴이 실제 여러 화면에서 일관되게 적용 가능한가
- 상태색과 브랜드색이 역할 충돌 없이 읽히는가

### Batch Workflow

- 목록에서 비교가 빨라졌는가
- 상세에서 다음 액션이 즉시 보이는가
- Draft 상태에서 작성과 관리가 동시에 가능한가

### Reading & Reuse

- Prompt 결과가 입력보다 읽기 쉬운가
- Templates가 작업 시작점으로 느껴지는가
- 모바일에서도 핵심 정보 손실이 없는가

## 8. 권장 산출물 순서

실제 실행은 아래 순서로 진행하는 것이 적절하다.

1. 화면 기획서
2. 와이어프레임 문서
3. 전역 시스템 문서
4. 구현 로드맵 문서
5. 실제 코드 작업

현재 1~4 문서화를 목표로 한다.

## 9. 완료 정의

개편이 완료되었다고 판단하려면 다음 조건을 만족해야 한다.

- Batch List, Batch Detail, Batch Create, Prompt Detail, Prompt Edit, Templates가 모두 같은 제품 언어를 공유한다
- 배치 운영, 작성, 결과 검토, 템플릿 재사용이 각기 다른 화면 목적을 분명히 드러낸다
- 사용자가 현재 상태와 가능한 액션을 읽는 시간이 눈에 띄게 줄어든다
