# 📚 Bible App Documentation Index

> 성경앱 프로젝트 기술 문서 목록
> 
> ⚠️ **Claude Code 필독**: 작업 전 반드시 `CLAUDE_CODE_RULES.md`를 먼저 읽을 것!

---

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | BibleApp (성경앱) |
| 프레임워크 | React Native (Expo) |
| 문서 생성일 | 2026-01-01 |
| 문서 버전 | v2.6.0 |
| 문서 경로 | `C:/claude/claudeproject/bibleapp/docs/` |
| 시간 기준 | 한국 표준시 (KST, UTC+9) |

---

## ⚠️ Claude Code 필수 규칙

```
┌─────────────────────────────────────────────────────────────┐
│                     문서 작업 시 필수 사항                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  0. 작업 전 CLAUDE_CODE_RULES.md 확인 ⭐ 최우선             │
│  1. 문서 생성 전 NAMING_CONVENTION.md 확인                  │
│  2. 시간은 반드시 한국시간(KST, UTC+9) 사용                 │
│  3. 명명 규칙에 따라 파일명 생성                            │
│  4. 문서 저장 후 이 파일(docs_index.md)에 등록              │
│  5. 저장 경로: C:/claude/claudeproject/bibleapp/docs/       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 문서명 형식 (Quick Reference)
```
[카테고리]_[파일명]_[YYYYMMDD]_[HHMM].md

카테고리: 신규생성 | 디버그 | 메뉴얼 | 수정 | 분석 | 회의록
시간: 한국시간 (KST)
```

---

## 문서 목록

### 📋 핵심 문서 (Core Documents)

| # | 문서명 | 카테고리 | 용도 | 생성일시 | 위치 |
|---|--------|----------|------|----------|------|
| 0 | **CLAUDE_CODE_RULES.md** | 메뉴얼 | ⭐ Claude Code 작업 규칙 (최우선) | 20260101_0930 | `C:/claude/claudeproject/bibleapp/docs/CLAUDE_CODE_RULES.md` |
| 0-1 | **bibleapp_WBS.md** | 메뉴얼 | 📊 작업 일정 및 진척 관리 (매 작업 시 확인/업데이트) | 20260101_0928 | `C:/claude/claudeproject/bibleapp/docs/bibleapp_WBS.md` |
| 1 | **NAMING_CONVENTION.md** | 메뉴얼 | 📌 문서 명명 규칙 정의 (필독) | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/NAMING_CONVENTION.md` |
| 1-1 | **BUG_LIST.md** | 메뉴얼 | 🐛 버그 추적 및 관리 | 20260104_0925 | `C:/claude/claudeproject/bibleapp/docs/BUG_LIST.md` |
| 2 | README.md | 신규생성 | 프로젝트 개요, 기술스택, 빠른 시작 가이드 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/README.md` |
| 3 | ARCHITECTURE.md | 신규생성 | 3-Layer 아키텍처, 보안 설계, 암호화 전략 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/ARCHITECTURE.md` |
| 4 | DATABASE.md | 신규생성 | SQLite 스키마, 테이블 정의, 쿼리 예시 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/DATABASE.md` |
| 5 | SCREENS.md | 신규생성 | 화면 설계, 네비게이션, 와이어프레임 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/SCREENS.md` |
| 6 | PROJECT_STRUCTURE.md | 신규생성 | 폴더 구조, 파일 템플릿, 설정 파일 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/PROJECT_STRUCTURE.md` |
| 7 | API.md | 신규생성 | 서비스 API 명세, 함수 시그니처, 에러 코드 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/API.md` |

### 📝 작업 문서 (Working Documents)

| # | 문서명 | 카테고리 | 용도 | 생성일시 | 위치 |
|---|--------|----------|------|----------|------|
| 8 | 신규생성_프로젝트구조생성_20260101_0923.md | 신규생성 | 2단계 작업: 폴더 구조 및 핵심 파일 생성 완료 | 20260101_0923 | `C:/claude/claudeproject/bibleapp/docs/신규생성_프로젝트구조생성_20260101_0923.md` |
| 9 | 신규생성_DatabaseService구현_20260101_0955.md | 신규생성 | 3단계 작업: DatabaseService 및 쿼리 함수 구현 완료 | 20260101_0955 | `C:/claude/claudeproject/bibleapp/docs/신규생성_DatabaseService구현_20260101_0955.md` |
| 10 | 신규생성_서비스레이어구현_20260101_1535.md | 신규생성 | 4단계 작업: 서비스 레이어 구현 완료 (5개 서비스 + 유틸리티) | 20260101_1535 | `C:/claude/claudeproject/bibleapp/docs/신규생성_서비스레이어구현_20260101_1535.md` |
| 11 | 신규생성_화면컴포넌트고도화_20260101_1556.md | 신규생성 | 5단계 작업: 화면 컴포넌트 고도화 완료 (12개 화면) | 20260101_1556 | `C:/claude/claudeproject/bibleapp/docs/신규생성_화면컴포넌트고도화_20260101_1556.md` |
| 12 | 신규생성_전체통합검증_20260101_1810.md | 신규생성 | 6단계 작업: 전체 통합 및 검증 완료 (프로젝트 완료) | 20260101_1810 | `C:/claude/claudeproject/bibleapp/docs/신규생성_전체통합검증_20260101_1810.md` |
| 13 | 디버그_웹호환성작업_20260101_2323.md | 디버그 | 7단계: 웹 호환성 작업 (보류) | 20260101_2323 | `C:/claude/claudeproject/bibleapp/docs/디버그_웹호환성작업_20260101_2323.md` |
| 14 | 신규생성_안드로이드에뮬레이터실행_20260103_1034.md | 신규생성 | 8단계: Android Studio 설치 및 에뮬레이터 실행 환경 구성 | 20260103_1034 | `C:/claude/claudeproject/bibleapp/docs/신규생성_안드로이드에뮬레이터실행_20260103_1034.md` |
| 15 | 디버그_gap스타일호환성수정_20260103_1150.md | 디버그 | gap 스타일 속성을 margin으로 수정 (호환성 향상) | 20260103_1150 | `C:/claude/claudeproject/bibleapp/docs/디버그_gap스타일호환성수정_20260103_1150.md` |
| 16 | 디버그_데이터베이스테이블누락수정_20260103_1210.md | 디버그 | 누락된 테이블 추가 (highlights, bookmarks, memo_tag_map) | 20260103_1210 | `C:/claude/claudeproject/bibleapp/docs/디버그_데이터베이스테이블누락수정_20260103_1210.md` |
| 17 | 신규생성_전체성경데이터통합_20260103_1400.md | 신규생성 | 9단계: 개역한글 성경 66권 31,102절 데이터 통합 | 20260103_1400 | `C:/claude/claudeproject/bibleapp/docs/신규생성_전체성경데이터통합_20260103_1400.md` |
| 18 | 디버그_ReadingScreen헤더수정_20260103_1542.md | 디버그 | ReadingScreen 헤더 상태바 간섭 수정 (커스텀 헤더 구현) | 20260103_1542 | `C:/claude/claudeproject/bibleapp/docs/디버그_ReadingScreen헤더수정_20260103_1542.md` |
| 19 | 수정_커스텀헤더전체적용_20260103_1605.md | 수정 | CustomHeader 컴포넌트 생성 및 전체 16개 화면 적용 | 20260103_1605 | `C:/claude/claudeproject/bibleapp/docs/수정_커스텀헤더전체적용_20260103_1605.md` |
| 20 | 신규생성_다중성경버전지원_20260103_1700.md | 신규생성 | 다중 성경 버전 다운로드 및 전환 기능 (API, 다운로드, UI) | 20260103_1700 | `C:/claude/claudeproject/bibleapp/docs/신규생성_다중성경버전지원_20260103_1700.md` |
| 21 | 디버그_API파싱버그수정_20260103_1830.md | 디버그 | API 응답 형식 파싱 버그 수정 및 지원 버전 11개 확장 | 20260103_1830 | `C:/claude/claudeproject/bibleapp/docs/디버그_API파싱버그수정_20260103_1830.md` |
| 22 | 메뉴얼_APK빌드및배포_20260103_1918.md | 메뉴얼 | APK 빌드 및 실제 폰 설치 가이드 | 20260103_1918 | `C:/claude/claudeproject/bibleapp/docs/메뉴얼_APK빌드및배포_20260103_1918.md` |
| 23 | 신규생성_GitHub연동_20260104_0917.md | 신규생성 | GitHub 저장소 연동 및 초기 커밋 (96개 파일) | 20260104_0917 | `C:/claude/claudeproject/bibleapp/docs/신규생성_GitHub연동_20260104_0917.md` |

<!-- 
┌─────────────────────────────────────────────────────────────┐
│                    새 문서 등록 방법                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 위 "작업 문서" 테이블에 새 행 추가                      │
│  2. 형식 예시:                                              │
│                                                             │
│  | 7 | 신규생성_메모암호화_20260101_1430.md | 신규생성 |    │
│  | 메모 암호화 기능 설계 | 20260101_1430 |                  │
│  | `C:/claude/.../신규생성_메모암호화_20260101_1430.md` |   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
-->

---

## 문서 상세 설명

### 0. CLAUDE_CODE_RULES.md ⭐ 최우선
- **용도**: Claude Code가 이 프로젝트에서 작업할 때 따라야 하는 필수 규칙
- **내용**:
  - 규칙 0: 작업 시작 시 반드시 한국시간(KST) 확인
  - 규칙 1: 시간은 반드시 한국시간(KST, UTC+9) 사용
  - 규칙 2: 작업 완료 후 반드시 문서화
  - 규칙 3: 매 작업 시 WBS 확인 및 업데이트
  - 문서화 절차 및 체크리스트
- **참조**: 모든 작업 전 가장 먼저 확인

### 0-1. bibleapp_WBS.md 📊 작업 관리
- **용도**: 전체 작업 일정, 진척 현황, 다음 작업 관리
- **내용**:
  - 전체 6단계 작업 일정
  - 단계별 세부 작업 목록
  - 진척률 및 현재 상태
  - 작업 기록 및 이슈 관리
- **참조**: 매 작업 시작/완료 시 반드시 확인 및 업데이트

### 1. NAMING_CONVENTION.md ⭐ 필독
- **용도**: Claude Code가 문서 생성 시 따라야 할 명명 규칙
- **내용**: 
  - 문서명 형식: `[카테고리]_[파일명]_[연월일]_[시분].md`
  - 카테고리 정의: 신규생성, 디버그, 메뉴얼, 수정, 분석, 회의록
  - 시간 기준: 한국 표준시 (KST)
  - docs_index.md 등록 규칙
  - 문서 내부 헤더 템플릿
- **참조**: 모든 문서 생성 작업 전 필수 확인

### 2. README.md
- **용도**: 프로젝트 시작점, Claude Code가 가장 먼저 읽어야 할 문서
- **내용**: 
  - 프로젝트 개요 및 핵심 기능 5가지
  - 기술 스택 (React Native, Expo, TypeScript, Zustand, SQLite)
  - 의존성 패키지 목록
  - 프로젝트 생성 및 실행 명령어
- **참조**: 모든 문서의 진입점

### 3. ARCHITECTURE.md
- **용도**: 시스템 전체 구조 이해, 설계 원칙 파악
- **내용**:
  - Presentation → Business → Data 3계층 아키텍처
  - 서비스별 책임 분리
  - Zustand 상태 관리 구조
  - AES-256 암호화 및 보안 계층
  - 오프라인 우선 전략
  - 에러 처리 패턴
- **참조**: DATABASE.md, API.md

### 4. DATABASE.md
- **용도**: 데이터베이스 스키마 구현, SQL 쿼리 작성
- **내용**:
  - Bible.db (읽기전용): languages, bibles, books, book_names, verses
  - User.db (읽기/쓰기): memos, memo_tags, bookmarks, highlights, settings
  - FTS5 전문검색 인덱스
  - 주요 쿼리 예시 (검색, CRUD, 통계)
  - TypeScript 타입 정의
  - DatabaseService 초기화 코드
- **참조**: API.md (서비스에서 사용)

### 5. SCREENS.md
- **용도**: UI/UX 구현, 화면 컴포넌트 개발
- **내용**:
  - 네비게이션 구조 (AuthStack, MainTabs, 각 Stack)
  - 9개 화면 ASCII 와이어프레임
  - 화면별 상태 및 props 정의
  - 공통 컴포넌트 목록
  - 테마 시스템 (Light/Dark)
- **참조**: PROJECT_STRUCTURE.md (컴포넌트 위치)

### 6. PROJECT_STRUCTURE.md
- **용도**: 프로젝트 초기 설정, 폴더/파일 생성
- **내용**:
  - 전체 폴더 트리 구조
  - App.tsx 메인 컴포넌트 템플릿
  - 네비게이터 코드 템플릿
  - Zustand Store 설정
  - package.json, tsconfig.json, babel.config.js
- **참조**: 모든 문서 (파일 위치 참조)

### 7. API.md
- **용도**: 서비스 레이어 구현, 비즈니스 로직 개발
- **내용**:
  - AuthService: 인증, 비밀번호, 생체인식
  - BibleService: 성경 조회, 검색
  - MemoService: 메모 CRUD, 태그 관리
  - AnalyticsService: 통계, 분석
  - ShareService: 이미지 생성, 공유
  - DatabaseService: SQLite 관리
  - 에러 코드 정의
- **참조**: DATABASE.md (쿼리), ARCHITECTURE.md (구조)

---

## Claude Code 작업 순서

### 프로젝트 초기 설정
```
0. CLAUDE_CODE_RULES.md 읽기 → 작업 규칙 숙지 ⭐ 최우선
1. NAMING_CONVENTION.md 읽기 → 문서 규칙 숙지
2. README.md 읽기 → 프로젝트 생성
3. PROJECT_STRUCTURE.md → 폴더 구조 생성
4. DATABASE.md → DatabaseService 구현
5. API.md → 서비스 레이어 구현
6. SCREENS.md → 화면 컴포넌트 구현
7. ARCHITECTURE.md → 전체 통합 및 검증
```

### 새 문서 생성 시 워크플로우
```
┌─────────────────────────────────────────────────────────────┐
│                    새 문서 생성 절차                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: NAMING_CONVENTION.md 확인                          │
│          ↓                                                  │
│  Step 2: 카테고리 결정                                      │
│          (신규생성/디버그/메뉴얼/수정/분석/회의록)          │
│          ↓                                                  │
│  Step 3: 파일명 결정 (한글 또는 영문, 공백 없음)            │
│          ↓                                                  │
│  Step 4: 현재 한국 시간 확인 (YYYYMMDD_HHMM)                │
│          ↓                                                  │
│  Step 5: 문서 생성                                          │
│          [카테고리]_[파일명]_[연월일]_[시분].md             │
│          ↓                                                  │
│  Step 6: docs_index.md에 등록 ⚠️ 필수                       │
│          "작업 문서" 테이블에 새 행 추가                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 문서 업데이트 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-01 09:00 | v1.0.0 | 최초 문서 생성 | Claude |
| 2026-01-01 09:30 | v1.1.0 | NAMING_CONVENTION.md 추가, 필수 규칙 섹션 추가 | Claude |
| 2026-01-01 09:23 | v1.2.0 | 2단계 작업 문서 등록 (프로젝트구조생성) | Claude |
| 2026-01-01 09:28 | v1.3.0 | bibleapp_WBS.md 등록, CLAUDE_CODE_RULES.md 규칙 추가 반영 | Claude |
| 2026-01-01 09:55 | v1.4.0 | 3단계 작업 문서 등록 (DatabaseService구현) | Claude |
| 2026-01-01 15:35 | v1.5.0 | 4단계 작업 문서 등록 (서비스레이어구현) | Claude |
| 2026-01-03 10:34 | v1.6.0 | 8단계 작업 문서 등록 (안드로이드에뮬레이터실행) | Claude |
| 2026-01-03 11:50 | v1.7.0 | gap 스타일 호환성 수정 디버그 문서 등록 | Claude |
| 2026-01-03 12:10 | v1.8.0 | 데이터베이스 테이블 누락 수정 디버그 문서 등록 | Claude Code |
| 2026-01-03 14:00 | v1.9.0 | 9단계 전체 성경 데이터 통합 문서 등록 (66권, 31,102절) | Claude |
| 2026-01-03 15:42 | v2.0.0 | ReadingScreen 헤더 상태바 간섭 수정 디버그 문서 등록 | Claude |
| 2026-01-03 16:05 | v2.1.0 | CustomHeader 전체 화면 적용 수정 문서 등록 | Claude |
| 2026-01-03 17:00 | v2.2.0 | 다중 성경 버전 지원 기능 문서 등록 | Claude |
| 2026-01-03 18:30 | v2.3.0 | API 파싱 버그 수정 디버그 문서 등록 (지원 버전 11개 확장) | Claude |
| 2026-01-03 19:18 | v2.4.0 | APK 빌드 및 배포 가이드 문서 등록 | Claude |
| 2026-01-04 09:17 | v2.5.0 | GitHub 저장소 연동 문서 등록 | Claude Code |
| 2026-01-04 09:25 | v2.6.0 | BUG_LIST.md 핵심 문서 등록 (버그 4건) | Claude Code |

---

## 참고사항

- 모든 문서는 Markdown 형식
- Claude Code가 파싱하기 쉬운 구조로 작성됨
- 코드 블록에 TypeScript 타입 정보 포함
- ASCII 다이어그램으로 시각적 구조 표현
- **새 문서 생성 시 반드시 이 파일(docs_index.md)에 등록할 것**
