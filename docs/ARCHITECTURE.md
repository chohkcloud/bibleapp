# 시스템 아키텍처 (ARCHITECTURE.md)

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Screens   │  │ Components  │  │   Hooks     │  │   Context   │    │
│  │  (화면)     │  │  (UI 요소)  │  │ (커스텀훅) │  │  (전역상태) │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         └────────────────┴────────────────┴────────────────┘           │
│                                    │                                    │
├────────────────────────────────────┼────────────────────────────────────┤
│                           BUSINESS LAYER                                │
│                                    │                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │BibleService │  │ MemoService │  │AnalyticsService│ │ShareService│    │
│  │ - search    │  │ - create    │  │ - getStats  │  │ - generate  │    │
│  │ - getVerse  │  │ - update    │  │ - getTopVerses│ │ - share     │    │
│  │ - getChapter│  │ - delete    │  │ - getDailyStats││             │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         └────────────────┴────────────────┴────────────────┘           │
│                                    │                                    │
├────────────────────────────────────┼────────────────────────────────────┤
│                             DATA LAYER                                  │
│                                    │                                    │
│  ┌─────────────────────────────────┴─────────────────────────────────┐ │
│  │                        DatabaseService                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │ │
│  │  │  Bible.db   │  │   User.db   │  │    SecureStore          │   │ │
│  │  │  (읽기전용) │  │  (읽기/쓰기)│  │  (암호화 키 저장)       │   │ │
│  │  │ - verses    │  │ - memos     │  │  - password_hash        │   │ │
│  │  │ - books     │  │ - bookmarks │  │  - encryption_key       │   │ │
│  │  │ - languages │  │ - settings  │  │  - biometric_enabled    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## 레이어별 책임

### 1. Presentation Layer

| 구성요소 | 책임 | 위치 |
|----------|------|------|
| Screens | 화면 단위 컴포넌트, 네비게이션 | `src/screens/` |
| Components | 재사용 UI 컴포넌트 | `src/components/` |
| Hooks | 비즈니스 로직 캡슐화 | `src/hooks/` |
| Store | Zustand 전역 상태 | `src/store/` |

### 2. Business Layer (Services)

| 서비스 | 책임 | 파일 |
|--------|------|------|
| BibleService | 성경 데이터 조회, 검색 | `src/services/bibleService.ts` |
| MemoService | 메모 CRUD, 암호화/복호화 | `src/services/memoService.ts` |
| AnalyticsService | 통계 데이터 생성 | `src/services/analyticsService.ts` |
| ShareService | 이미지 생성, 공유 | `src/services/shareService.ts` |
| AuthService | 인증, 비밀번호 관리 | `src/services/authService.ts` |

### 3. Data Layer

| 구성요소 | 용도 | 기술 |
|----------|------|------|
| Bible.db | 성경 원문 (읽기전용) | expo-sqlite |
| User.db | 사용자 데이터 | expo-sqlite |
| SecureStore | 민감 정보 암호화 저장 | expo-secure-store |

## 데이터 흐름

### 성경 읽기 흐름
```
User Action → Screen → useBible Hook → BibleService → DatabaseService → Bible.db
                ↑                                              │
                └──────────────── verses[] ←───────────────────┘
```

### 메모 저장 흐름
```
User Input → MemoScreen → useMemo Hook → MemoService → encrypt() → DatabaseService → User.db
                                              ↓
                                        SecureStore (key)
```

### 공유 흐름
```
Share Button → ShareScreen → useShare Hook → ShareService → ViewShot → Image
                                                   ↓
                                            expo-sharing → KakaoTalk/Email
```

## 상태 관리 (Zustand)

```typescript
// src/store/index.ts

interface AppState {
  // Auth
  isAuthenticated: boolean;
  isLocked: boolean;
  
  // Bible
  currentBible: string;        // 'KRV' | 'NIV' | 'JPN'
  currentBook: number;         // 1-66
  currentChapter: number;
  
  // UI
  fontSize: number;
  theme: 'light' | 'dark';
  language: 'ko' | 'en' | 'ja';
  
  // Actions
  setAuthenticated: (value: boolean) => void;
  setBible: (bible: string) => void;
  setBook: (book: number) => void;
  setChapter: (chapter: number) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
```

## 보안 아키텍처

### 암호화 전략

```
┌─────────────────────────────────────────────────────────────┐
│                      보안 계층 구조                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: App Lock                                          │
│  ├── PIN (6자리) → bcrypt hash → SecureStore               │
│  └── Biometric (FaceID/TouchID) → expo-local-authentication │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Data Encryption                                   │
│  ├── Memo Content → AES-256-GCM → User.db                  │
│  └── Encryption Key → SecureStore (Keychain/Keystore)       │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Secure Storage                                    │
│  └── Sensitive Data → expo-secure-store                     │
│      - password_hash                                        │
│      - encryption_key                                       │
│      - user_preferences                                     │
└─────────────────────────────────────────────────────────────┘
```

### 암호화 구현

```typescript
// src/utils/crypto.ts

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// AES-256 암호화 키 생성
export async function generateEncryptionKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Buffer.from(randomBytes).toString('base64');
}

// 메모 암호화
export async function encryptMemo(content: string, key: string): Promise<string> {
  // AES-256-GCM 암호화 구현
}

// 메모 복호화
export async function decryptMemo(encrypted: string, key: string): Promise<string> {
  // AES-256-GCM 복호화 구현
}

// 비밀번호 해시
export async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + SALT
  );
}
```

## 오프라인 우선 전략

```
┌─────────────────────────────────────────────────────────────┐
│                    Offline-First Architecture               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   앱 설치 시:                                               │
│   ┌─────────────┐      ┌─────────────┐                     │
│   │ Assets에서  │ ───▶ │ Documents로 │                     │
│   │ Bible.db    │      │ 복사        │                     │
│   └─────────────┘      └─────────────┘                     │
│                                                             │
│   일반 사용:                                                │
│   ┌─────────────┐      ┌─────────────┐                     │
│   │   SQLite    │ ◀──▶ │    App      │  (네트워크 불필요)  │
│   │  (Local)    │      │             │                     │
│   └─────────────┘      └─────────────┘                     │
│                                                             │
│   선택적 클라우드 백업 (향후):                              │
│   ┌─────────────┐      ┌─────────────┐                     │
│   │   User.db   │ ───▶ │  Firebase   │  (메모만 백업)      │
│   │  (Memos)    │      │  (Optional) │                     │
│   └─────────────┘      └─────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 에러 처리 전략

```typescript
// src/utils/errorHandler.ts

export enum ErrorCode {
  DB_CONNECTION_FAILED = 'DB_001',
  DB_QUERY_FAILED = 'DB_002',
  ENCRYPTION_FAILED = 'ENC_001',
  DECRYPTION_FAILED = 'ENC_002',
  AUTH_FAILED = 'AUTH_001',
  SHARE_FAILED = 'SHARE_001',
}

export class AppError extends Error {
  code: ErrorCode;
  
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function handleError(error: AppError): void {
  console.error(`[${error.code}] ${error.message}`);
  // 사용자에게 적절한 메시지 표시
}
```
