# Bible App Documentation Index

> 성경앱 프로젝트 기술 문서 목록
>
> **Claude Code 필독**: 작업 전 반드시 `CLAUDE_CODE_RULES.md`를 먼저 읽을 것!

---

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | BibleApp (성경앱) |
| 프레임워크 | React Native (Expo) |
| 문서 생성일 | 2026-01-01 |
| 문서 버전 | v3.5.0 |
| 문서 경로 | `C:/claude/claudeproject/bibleapp/docs/` |
| 시간 기준 | 한국 표준시 (KST, UTC+9) |

---

## Claude Code 필수 규칙

```
문서 작업 시 필수 사항

  0. 작업 전 CLAUDE_CODE_RULES.md 확인 (최우선)
  1. 문서 생성 전 NAMING_CONVENTION.md 확인
  2. 시간은 반드시 한국시간(KST, UTC+9) 사용
  3. 명명 규칙에 따라 파일명 생성
  4. 문서 저장 후 이 파일(docs_index.md)에 등록
  5. 저장 경로: C:/claude/claudeproject/bibleapp/docs/
```

### 문서명 형식 (Quick Reference)
```
[카테고리]_[파일명]_[YYYYMMDD]_[HHMM].md

카테고리: 신규생성 | 디버그 | 메뉴얼 | 수정 | 분석 | 회의록
시간: 한국시간 (KST)
```

---

## 문서 목록

### 핵심 문서 (Core Documents)

| # | 문서명 | 카테고리 | 용도 | 생성일시 | 위치 |
|---|--------|----------|------|----------|------|
| 0 | **CLAUDE_CODE_RULES.md** | 메뉴얼 | Claude Code 작업 규칙 (최우선) | 20260101_0930 | `C:/claude/claudeproject/bibleapp/docs/CLAUDE_CODE_RULES.md` |
| 0-1 | **bibleapp_WBS.md** | 메뉴얼 | 작업 일정 및 진척 관리 | 20260101_0928 | `C:/claude/claudeproject/bibleapp/docs/bibleapp_WBS.md` |
| 1 | **NAMING_CONVENTION.md** | 메뉴얼 | 문서 명명 규칙 정의 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/NAMING_CONVENTION.md` |
| 1-1 | **BUG_LIST.md** | 메뉴얼 | 버그 추적 및 관리 | 20260104_0925 | `C:/claude/claudeproject/bibleapp/docs/BUG_LIST.md` |
| 2 | README.md | 신규생성 | 프로젝트 개요, 기술스택, 빠른 시작 가이드 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/README.md` |
| 3 | ARCHITECTURE.md | 신규생성 | 3-Layer 아키텍처, 보안 설계, 암호화 전략 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/ARCHITECTURE.md` |
| 4 | DATABASE.md | 신규생성 | SQLite 스키마, 테이블 정의, 쿼리 예시 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/DATABASE.md` |
| 5 | SCREENS.md | 신규생성 | 화면 설계, 네비게이션, 와이어프레임 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/SCREENS.md` |
| 6 | PROJECT_STRUCTURE.md | 신규생성 | 폴더 구조, 파일 템플릿, 설정 파일 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/PROJECT_STRUCTURE.md` |
| 7 | API.md | 신규생성 | 서비스 API 명세, 함수 시그니처, 에러 코드 | 20260101_0900 | `C:/claude/claudeproject/bibleapp/docs/API.md` |

### 작업 문서 (Working Documents)

| # | 문서명 | 카테고리 | 용도 | 생성일시 | 위치 |
|---|--------|----------|------|----------|------|
| 8 | 신규생성_프로젝트구조생성_20260101_0923.md | 신규생성 | 2단계 작업: 폴더 구조 및 핵심 파일 생성 완료 | 20260101_0923 | `C:/claude/claudeproject/bibleapp/docs/신규생성_프로젝트구조생성_20260101_0923.md` |
| 9 | 신규생성_DatabaseService구현_20260101_0955.md | 신규생성 | 3단계 작업: DatabaseService 및 쿼리 함수 구현 완료 | 20260101_0955 | `C:/claude/claudeproject/bibleapp/docs/신규생성_DatabaseService구현_20260101_0955.md` |
| 10 | 신규생성_서비스레이어구현_20260101_1535.md | 신규생성 | 4단계 작업: 서비스 레이어 구현 완료 | 20260101_1535 | `C:/claude/claudeproject/bibleapp/docs/신규생성_서비스레이어구현_20260101_1535.md` |
| 11 | 신규생성_화면컴포넌트고도화_20260101_1556.md | 신규생성 | 5단계 작업: 화면 컴포넌트 고도화 완료 | 20260101_1556 | `C:/claude/claudeproject/bibleapp/docs/신규생성_화면컴포넌트고도화_20260101_1556.md` |
| 12 | 신규생성_전체통합검증_20260101_1810.md | 신규생성 | 6단계 작업: 전체 통합 및 검증 완료 | 20260101_1810 | `C:/claude/claudeproject/bibleapp/docs/신규생성_전체통합검증_20260101_1810.md` |
| 13 | 디버그_웹호환성작업_20260101_2323.md | 디버그 | 7단계: 웹 호환성 작업 (보류) | 20260101_2323 | `C:/claude/claudeproject/bibleapp/docs/디버그_웹호환성작업_20260101_2323.md` |
| 14 | 신규생성_안드로이드에뮬레이터실행_20260103_1034.md | 신규생성 | 8단계: Android Studio 설치 및 에뮬레이터 실행 환경 구성 | 20260103_1034 | `C:/claude/claudeproject/bibleapp/docs/신규생성_안드로이드에뮬레이터실행_20260103_1034.md` |
| 15 | 디버그_gap스타일호환성수정_20260103_1150.md | 디버그 | gap 스타일 속성을 margin으로 수정 | 20260103_1150 | `C:/claude/claudeproject/bibleapp/docs/디버그_gap스타일호환성수정_20260103_1150.md` |
| 16 | 디버그_데이터베이스테이블누락수정_20260103_1210.md | 디버그 | 누락된 테이블 추가 (highlights, bookmarks, memo_tag_map) | 20260103_1210 | `C:/claude/claudeproject/bibleapp/docs/디버그_데이터베이스테이블누락수정_20260103_1210.md` |
| 17 | 신규생성_전체성경데이터통합_20260103_1400.md | 신규생성 | 9단계: 개역한글 성경 66권 31,102절 데이터 통합 | 20260103_1400 | `C:/claude/claudeproject/bibleapp/docs/신규생성_전체성경데이터통합_20260103_1400.md` |
| 18 | 디버그_ReadingScreen헤더수정_20260103_1542.md | 디버그 | ReadingScreen 헤더 상태바 간섭 수정 | 20260103_1542 | `C:/claude/claudeproject/bibleapp/docs/디버그_ReadingScreen헤더수정_20260103_1542.md` |
| 19 | 수정_커스텀헤더전체적용_20260103_1605.md | 수정 | CustomHeader 컴포넌트 생성 및 전체 16개 화면 적용 | 20260103_1605 | `C:/claude/claudeproject/bibleapp/docs/수정_커스텀헤더전체적용_20260103_1605.md` |
| 20 | 신규생성_다중성경버전지원_20260103_1700.md | 신규생성 | 다중 성경 버전 다운로드 및 전환 기능 | 20260103_1700 | `C:/claude/claudeproject/bibleapp/docs/신규생성_다중성경버전지원_20260103_1700.md` |
| 21 | 디버그_API파싱버그수정_20260103_1830.md | 디버그 | API 응답 형식 파싱 버그 수정 및 지원 버전 11개 확장 | 20260103_1830 | `C:/claude/claudeproject/bibleapp/docs/디버그_API파싱버그수정_20260103_1830.md` |
| 22 | 메뉴얼_APK빌드및배포_20260103_1918.md | 메뉴얼 | APK 빌드 및 실제 폰 설치 가이드 | 20260103_1918 | `C:/claude/claudeproject/bibleapp/docs/메뉴얼_APK빌드및배포_20260103_1918.md` |
| 23 | 신규생성_GitHub연동_20260104_0917.md | 신규생성 | GitHub 저장소 연동 및 초기 커밋 (96개 파일) | 20260104_0917 | `C:/claude/claudeproject/bibleapp/docs/신규생성_GitHub연동_20260104_0917.md` |
| 24 | 신규생성_마지막읽은위치저장_20260119_0728.md | 신규생성 | 앱 재시작 시 마지막 읽은 위치 유지 기능 (15단계) | 20260119_0728 | `C:/claude/claudeproject/bibleapp/docs/신규생성_마지막읽은위치저장_20260119_0728.md` |
| 25 | 수정_장선택화면책변경기능_20260119_0800.md | 수정 | 장 선택 화면에서 책 변경 기능 추가 (16단계) | 20260119_0800 | `C:/claude/claudeproject/bibleapp/docs/수정_장선택화면책변경기능_20260119_0800.md` |
| 26 | 메뉴얼_포트포워딩설정_20260119_2226.md | 메뉴얼 | Choco AI API 외부 접속을 위한 포트포워딩 설정 가이드 | 20260119_2226 | `C:/claude/claudeproject/bibleapp/docs/메뉴얼_포트포워딩설정_20260119_2226.md` |
| 27 | 수정_메모화면UX개선_20260125_1534.md | 수정 | 메모 화면 키보드 이슈 해결 및 UX 개선 (18단계) | 20260125_1534 | `C:/claude/claudeproject/bibleapp/docs/수정_메모화면UX개선_20260125_1534.md` |
| 28 | 수정_UI개선_20260125_2215.md | 수정 | 글자 크기 +/- 버튼 추가 및 홈 화면 헤더 제거 (18단계) | 20260125_2215 | `C:/claude/claudeproject/bibleapp/docs/수정_UI개선_20260125_2215.md` |
| 29 | 디버그_성경버전전환미표시수정_20260129_2155.md | 디버그 | 성경 버전 전환 시 본문 미표시 버그 수정 (ReadingScreen 번들/DB 분기) | 20260129_2155 | `C:/claude/claudeproject/bibleapp/docs/디버그_성경버전전환미표시수정_20260129_2155.md` |
| 30 | 디버그_ChocoAPI접속테스트수정_20260129_2201.md | 디버그 | Choco API 접속 테스트 엔드포인트 불일치 수정 (/health → /api/health) | 20260129_2201 | `C:/claude/claudeproject/bibleapp/docs/디버그_ChocoAPI접속테스트수정_20260129_2201.md` |
| 31 | 수정_AI분석결과영구저장_20260131_1000.md | 수정 | 19단계: AI 분석 결과 영구 저장 + 히스토리 관리 | 20260131_1000 | `C:/claude/claudeproject/bibleapp/docs/수정_AI분석결과영구저장_20260131_1000.md` |

---

## 문서 업데이트 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-01 09:00 | v1.0.0 | 최초 문서 생성 | Claude |
| 2026-01-01 09:30 | v1.1.0 | NAMING_CONVENTION.md 추가 | Claude |
| 2026-01-01 09:23 | v1.2.0 | 2단계 작업 문서 등록 | Claude |
| 2026-01-01 09:28 | v1.3.0 | bibleapp_WBS.md 등록 | Claude |
| 2026-01-01 09:55 | v1.4.0 | 3단계 작업 문서 등록 | Claude |
| 2026-01-01 15:35 | v1.5.0 | 4단계 작업 문서 등록 | Claude |
| 2026-01-03 10:34 | v1.6.0 | 8단계 작업 문서 등록 | Claude |
| 2026-01-03 11:50 | v1.7.0 | gap 스타일 호환성 수정 디버그 문서 등록 | Claude |
| 2026-01-03 12:10 | v1.8.0 | 데이터베이스 테이블 누락 수정 문서 등록 | Claude Code |
| 2026-01-03 14:00 | v1.9.0 | 9단계 전체 성경 데이터 통합 문서 등록 | Claude |
| 2026-01-03 15:42 | v2.0.0 | ReadingScreen 헤더 수정 문서 등록 | Claude |
| 2026-01-03 16:05 | v2.1.0 | CustomHeader 전체 화면 적용 문서 등록 | Claude |
| 2026-01-03 17:00 | v2.2.0 | 다중 성경 버전 지원 기능 문서 등록 | Claude |
| 2026-01-03 18:30 | v2.3.0 | API 파싱 버그 수정 문서 등록 | Claude |
| 2026-01-03 19:18 | v2.4.0 | APK 빌드 및 배포 가이드 문서 등록 | Claude |
| 2026-01-04 09:17 | v2.5.0 | GitHub 저장소 연동 문서 등록 | Claude Code |
| 2026-01-04 09:25 | v2.6.0 | BUG_LIST.md 핵심 문서 등록 | Claude Code |
| 2026-01-19 07:28 | v2.7.0 | 15단계: 마지막 읽은 위치 저장 기능 문서 등록 | Claude Code |
| 2026-01-19 08:00 | v2.8.0 | 16단계: 장 선택 화면 책 변경 기능 문서 등록 | Claude Code |
| 2026-01-19 22:26 | v2.9.0 | 17단계: 포트포워딩 설정 가이드 문서 등록 | Claude Code |
| 2026-01-25 15:34 | v3.0.0 | 18단계: 메모 화면 UX 개선 문서 등록 | Claude Code |
| 2026-01-25 22:15 | v3.1.0 | 18단계: UI 개선 문서 등록 (글자 크기 버튼, 홈 헤더 제거) | Claude Code |
| 2026-01-29 21:55 | v3.3.0 | 디버그: 성경 버전 전환 미표시 수정 문서 등록 | Claude Code |
| 2026-01-29 22:01 | v3.4.0 | 디버그: Choco API 접속 테스트 수정 문서 등록 | Claude Code |
| 2026-01-31 10:00 | v3.5.0 | 19단계: AI 분석 결과 영구 저장 + 히스토리 관리 문서 등록 | Claude Code |

---

## 참고사항

- 모든 문서는 Markdown 형식
- Claude Code가 파싱하기 쉬운 구조로 작성됨
- 코드 블록에 TypeScript 타입 정보 포함
- **새 문서 생성 시 반드시 이 파일(docs_index.md)에 등록할 것**

