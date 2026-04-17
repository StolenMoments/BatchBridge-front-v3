# BatchBridge 개편 문서 묶음

## 문서 목적

이 디렉터리는 BatchBridge를 "반복 사용에 강한 운영 콘솔"로 개편하기 위한 설계 문서를 모아둔 공간이다. 구현 전에 의도, 구조, 우선순위, 전역 시스템을 먼저 합의하기 위한 문서 세트다.

## 권장 읽기 순서

1. `operational-console-screen-plan.md`
2. `operational-console-wireframes.md`
3. `operational-console-system-spec.md`
4. `operational-console-roadmap.md`

## 문서 설명

### `operational-console-screen-plan.md`

- 화면 정의와 디자인 철학의 기준 문서
- 화면 목적, 핵심 사용자 질문, 주요 상태, 전역 원칙을 정의한다

### `operational-console-wireframes.md`

- 화면 구조를 저해상도 와이어프레임으로 정리한 문서
- 정보 배치, 액션 위치, 반응형 전환 구조를 본다

### `operational-console-system-spec.md`

- 전역 토큰, 레이아웃, 컴포넌트 언어, 상태 표현 시스템 기준 문서
- 구현 기술과 무관하게 유지해야 하는 공통 규칙을 정의한다

### `operational-console-roadmap.md`

- 실제 구현 순서와 우선순위를 정리한 실행 계획 문서
- 어떤 단위로 나누어 작업할지와 단계별 성공 기준을 담고 있다

## 사용 원칙

- 새로운 화면/컴포넌트 설계는 먼저 `screen-plan`과 충돌하지 않는지 확인한다
- 레이아웃/상태 표현은 `system-spec` 기준을 따른다
- 실제 코드 작업 우선순위는 `roadmap`을 기준으로 정한다
- 와이어프레임은 시각 시안이 아니라 정보 구조 기준안으로 사용한다
