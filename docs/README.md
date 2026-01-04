# 성경앱 (Bible App) - 프로젝트 문서

> Claude Code 작업용 기술 문서

## 개발 진행 현황

| 단계 | 상태 | 설명 |
|------|------|------|
| Stage 1: 프로젝트 기반 구축 | 완료 | Expo SDK 54, 폴더 구조 설정 |
| Stage 2: 데이터 레이어 구현 | 완료 | SQLite, 쿼리 함수, 서비스 레이어 |
| Stage 3: 비즈니스 로직 | 완료 | 인증, 암호화, 메모/북마크 서비스 |
| Stage 4: UI 기본 구현 | 완료 | 네비게이션, 테마, 기본 화면 |
| Stage 5: 화면 컴포넌트 고도화 | 완료 | 모든 화면 구현, 서비스 연동 |
| Stage 6: 전체 통합 및 검증 | 완료 | TypeScript 컴파일, 빌드 테스트 |

**전체 진행률: 100%**

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | BibleApp (성경앱) |
| 프레임워크 | React Native (Expo SDK 54) |
| 언어 | TypeScript (strict mode) |
| 상태관리 | Zustand |
| 로컬DB | SQLite (expo-sqlite) |
| 암호화 | expo-crypto, expo-secure-store |
| 아키텍처 | 3-Layer (Presentation, Business, Data) |

## 핵심 기능 (5가지)

1. **다국어 성경 검색** - 한국어/영어/일본어 성경, 책/장/절/단어 검색
2. **성경 읽기 & 묵상 메모** - 구절별 메모 작성/수정/삭제
3. **메모 분석** - 구절별 메모 목록, 일자별 통계, 자주 인용 구절 순위
4. **암호화 (비밀번호)** - 앱 잠금, 메모 암호화 저장
5. **시각화 공유** - 묵상 카드 이미지 생성 → 카카오톡/이메일 공유

## 문서 구조

```
bible-app-docs/
├── README.md                 # 이 파일 (프로젝트 개요)
├── ARCHITECTURE.md           # 시스템 아키텍처
├── DATABASE.md               # DB 스키마 및 쿼리
├── SCREENS.md                # 화면 설계 및 네비게이션
├── API.md                    # 내부 서비스 API 명세
└── PROJECT_STRUCTURE.md      # 폴더/파일 구조
```

## 기술 스택 상세

### Core
```json
{
  "expo": "~54.0.0",
  "react": "19.0.0",
  "react-native": "0.79.0",
  "typescript": "^5.8.0"
}
```

### Dependencies
```json
{
  "expo-sqlite": "~16.0.0",
  "expo-secure-store": "~15.0.0",
  "expo-crypto": "~15.0.0",
  "expo-file-system": "~18.0.0",
  "expo-sharing": "~13.0.0",
  "expo-local-authentication": "~15.0.0",
  "zustand": "^5.0.0",
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/native-stack": "^7.0.0",
  "@react-navigation/bottom-tabs": "^7.0.0",
  "react-native-view-shot": "^4.0.0"
}
```

## 빠른 시작

```bash
# 프로젝트 생성
npx create-expo-app bible-app --template expo-template-blank-typescript

# 의존성 설치
cd bible-app
npx expo install expo-sqlite expo-secure-store expo-crypto expo-file-system expo-sharing expo-local-authentication react-native-view-shot

npm install zustand @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs date-fns

npx expo install react-native-screens react-native-safe-area-context

# 실행
npx expo start
```

## 다음 단계

1. `PROJECT_STRUCTURE.md` 참고하여 폴더 구조 생성
2. `DATABASE.md` 참고하여 SQLite 스키마 구현
3. `SCREENS.md` 참고하여 화면 컴포넌트 구현
4. `API.md` 참고하여 서비스 레이어 구현
