# 서비스 API 명세 (API.md)

> 내부 서비스 레이어 API 정의 (로컬 앱, 외부 서버 없음)

---

## 서비스 구조

```
┌─────────────────────────────────────────────────────────────┐
│                       Services Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │AuthService  │  │BibleService │  │ MemoService │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────┴────────────────┴────────────────┴──────┐         │
│  │              DatabaseService                   │         │
│  └────────────────────────────────────────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │Analytics    │  │ShareService │                          │
│  │Service      │  │             │                          │
│  └─────────────┘  └─────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. AuthService

> 인증 및 보안 관련 서비스

### 파일: `src/services/authService.ts`

```typescript
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

class AuthService {
  private readonly PASSWORD_KEY = 'password_hash';
  private readonly ENCRYPTION_KEY = 'encryption_key';
  private readonly BIOMETRIC_KEY = 'biometric_enabled';
  private readonly SALT = 'bible-app-salt-v1';

  /**
   * 비밀번호 설정 여부 확인
   */
  async isPasswordSet(): Promise<boolean>;

  /**
   * 비밀번호 설정 (최초 또는 변경)
   * @param password - 6자리 PIN
   */
  async setPassword(password: string): Promise<void>;

  /**
   * 비밀번호 검증
   * @param password - 입력된 PIN
   * @returns 일치 여부
   */
  async verifyPassword(password: string): Promise<boolean>;

  /**
   * 비밀번호 변경
   * @param oldPassword - 기존 PIN
   * @param newPassword - 새 PIN
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<boolean>;

  /**
   * 생체인식 사용 가능 여부
   */
  async isBiometricAvailable(): Promise<boolean>;

  /**
   * 생체인식 활성화 여부
   */
  async isBiometricEnabled(): Promise<boolean>;

  /**
   * 생체인식 활성화/비활성화
   */
  async setBiometricEnabled(enabled: boolean): Promise<void>;

  /**
   * 생체인식 인증 시도
   */
  async authenticateWithBiometric(): Promise<boolean>;

  /**
   * 암호화 키 조회 (메모 암호화용)
   */
  async getEncryptionKey(): Promise<string>;
}

export const authService = new AuthService();
```

### 사용 예시

```typescript
// 비밀번호 설정
await authService.setPassword('123456');

// 비밀번호 검증
const isValid = await authService.verifyPassword('123456');

// 생체인식 인증
if (await authService.isBiometricEnabled()) {
  const success = await authService.authenticateWithBiometric();
}
```

---

## 2. BibleService

> 성경 데이터 조회 및 검색 서비스

### 파일: `src/services/bibleService.ts`

```typescript
import { databaseService } from './database';
import { 
  Language, Bible, Book, BookName, Verse, VerseWithMeta 
} from '../types/database';

class BibleService {
  /**
   * 지원 언어 목록 조회
   */
  async getLanguages(): Promise<Language[]>;

  /**
   * 성경 버전 목록 조회
   * @param langId - 언어 ID (선택)
   */
  async getBibles(langId?: string): Promise<Bible[]>;

  /**
   * 성경 책 목록 조회
   * @param langId - 언어 ID (책 이름 언어)
   */
  async getBooks(langId: string): Promise<(Book & BookName)[]>;

  /**
   * 특정 장의 구절 목록 조회
   * @param bibleId - 성경 버전 ID
   * @param bookId - 책 ID (1-66)
   * @param chapter - 장 번호
   */
  async getChapter(
    bibleId: string, 
    bookId: number, 
    chapter: number
  ): Promise<VerseWithMeta[]>;

  /**
   * 특정 구절 조회
   * @param bibleId - 성경 버전 ID
   * @param bookId - 책 ID
   * @param chapter - 장 번호
   * @param verseNum - 절 번호
   */
  async getVerse(
    bibleId: string,
    bookId: number,
    chapter: number,
    verseNum: number
  ): Promise<Verse | null>;

  /**
   * verse_id로 구절 조회
   */
  async getVerseById(verseId: number): Promise<Verse | null>;

  /**
   * 성경 검색 (전문검색)
   * @param bibleId - 성경 버전 ID
   * @param query - 검색어
   * @param langId - 책 이름 표시 언어
   * @param limit - 결과 개수 제한 (기본 100)
   */
  async search(
    bibleId: string,
    query: string,
    langId: string,
    limit?: number
  ): Promise<(Verse & { book_name: string })[]>;

  /**
   * 책의 총 장 수 조회
   */
  async getTotalChapters(bookId: number): Promise<number>;

  /**
   * 장의 총 절 수 조회
   */
  async getTotalVerses(
    bibleId: string, 
    bookId: number, 
    chapter: number
  ): Promise<number>;
}

export const bibleService = new BibleService();
```

### 반환 타입

```typescript
// 장 조회 결과
interface VerseWithMeta {
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  text: string;
  memo_count: number;        // 해당 구절의 메모 개수
  highlight_color: string | null;  // 하이라이트 색상
}

// 검색 결과
interface SearchResult extends Verse {
  book_name: string;  // 책 이름 (언어별)
  snippet?: string;   // 검색어 하이라이트된 텍스트
}
```

### 사용 예시

```typescript
// 요한복음 3장 조회
const verses = await bibleService.getChapter('KRV', 43, 3);

// "사랑" 검색
const results = await bibleService.search('KRV', '사랑', 'ko', 100);

// 특정 구절 조회
const verse = await bibleService.getVerse('KRV', 43, 3, 16);
```

---

## 3. MemoService

> 묵상 메모 CRUD 서비스

### 파일: `src/services/memoService.ts`

```typescript
import { databaseService } from './database';
import { authService } from './authService';
import { encrypt, decrypt } from '../utils/crypto';
import { Memo, MemoTag } from '../types/database';

interface CreateMemoInput {
  verseId: number;
  bibleId: string;
  bookId: number;
  chapter: number;
  verseNum: number;
  content: string;
  tagIds?: number[];
}

interface UpdateMemoInput {
  content?: string;
  tagIds?: number[];
}

interface MemoFilter {
  bookId?: number;
  chapter?: number;
  verseNum?: number;
  tagId?: number;
  startDate?: string;  // ISO 8601
  endDate?: string;
}

class MemoService {
  /**
   * 메모 생성
   * @param input - 메모 데이터
   * @returns 생성된 메모 ID
   */
  async createMemo(input: CreateMemoInput): Promise<string>;

  /**
   * 메모 조회
   * @param memoId - 메모 ID
   */
  async getMemo(memoId: string): Promise<Memo | null>;

  /**
   * 메모 목록 조회
   * @param filter - 필터 조건
   * @param limit - 결과 개수
   * @param offset - 오프셋
   */
  async getMemos(
    filter?: MemoFilter,
    limit?: number,
    offset?: number
  ): Promise<Memo[]>;

  /**
   * 특정 구절의 메모 목록
   */
  async getMemosByVerse(
    bibleId: string,
    bookId: number,
    chapter: number,
    verseNum: number
  ): Promise<Memo[]>;

  /**
   * 메모 수정
   */
  async updateMemo(memoId: string, input: UpdateMemoInput): Promise<void>;

  /**
   * 메모 삭제 (Soft Delete)
   */
  async deleteMemo(memoId: string): Promise<void>;

  /**
   * 메모 영구 삭제
   */
  async permanentDeleteMemo(memoId: string): Promise<void>;

  /**
   * 삭제된 메모 복원
   */
  async restoreMemo(memoId: string): Promise<void>;

  // === 태그 관련 ===

  /**
   * 태그 목록 조회
   */
  async getTags(): Promise<MemoTag[]>;

  /**
   * 태그 생성
   */
  async createTag(name: string, color: string): Promise<number>;

  /**
   * 태그 삭제
   */
  async deleteTag(tagId: number): Promise<void>;

  /**
   * 메모에 태그 추가
   */
  async addTagToMemo(memoId: string, tagId: number): Promise<void>;

  /**
   * 메모에서 태그 제거
   */
  async removeTagFromMemo(memoId: string, tagId: number): Promise<void>;
}

export const memoService = new MemoService();
```

### 사용 예시

```typescript
// 메모 생성
const memoId = await memoService.createMemo({
  verseId: 12345,
  bibleId: 'KRV',
  bookId: 43,
  chapter: 3,
  verseNum: 16,
  content: '하나님의 무한하신 사랑을 느낍니다.',
  tagIds: [1, 2]  // 감사, 묵상
});

// 특정 구절의 메모 조회
const memos = await memoService.getMemosByVerse('KRV', 43, 3, 16);

// 필터링된 메모 목록
const filteredMemos = await memoService.getMemos({
  tagId: 1,  // 감사 태그
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

---

## 4. AnalyticsService

> 통계 및 분석 서비스

### 파일: `src/services/analyticsService.ts`

```typescript
import { databaseService } from './database';
import { TopVerse, DailyStat, MonthlyStat } from '../types/database';

interface AnalyticsSummary {
  totalMemos: number;
  thisWeekMemos: number;
  thisMonthMemos: number;
  streakDays: number;  // 연속 묵상 일수
}

interface TagStat {
  tagId: number;
  tagName: string;
  color: string;
  count: number;
  percentage: number;
}

class AnalyticsService {
  /**
   * 전체 요약 통계
   */
  async getSummary(): Promise<AnalyticsSummary>;

  /**
   * 자주 묵상한 구절 TOP N
   * @param langId - 책 이름 표시 언어
   * @param limit - 결과 개수 (기본 10)
   */
  async getTopVerses(langId: string, limit?: number): Promise<TopVerse[]>;

  /**
   * 일별 묵상 통계
   * @param days - 최근 N일 (기본 30)
   */
  async getDailyStats(days?: number): Promise<DailyStat[]>;

  /**
   * 월별 묵상 통계
   * @param months - 최근 N개월 (기본 12)
   */
  async getMonthlyStats(months?: number): Promise<MonthlyStat[]>;

  /**
   * 태그별 분포
   */
  async getTagStats(): Promise<TagStat[]>;

  /**
   * 특정 구절의 묵상 히스토리
   */
  async getVerseHistory(
    bookId: number,
    chapter: number,
    verseNum: number,
    langId: string
  ): Promise<{
    totalCount: number;
    firstMemoDate: string;
    lastMemoDate: string;
    memos: Memo[];
  }>;

  /**
   * 연속 묵상 기록 계산
   */
  async calculateStreak(): Promise<number>;

  /**
   * 가장 활발했던 요일
   */
  async getMostActiveDay(): Promise<{
    dayOfWeek: number;  // 0-6 (일-토)
    count: number;
  }>;
}

export const analyticsService = new AnalyticsService();
```

### 사용 예시

```typescript
// 요약 통계
const summary = await analyticsService.getSummary();
// { totalMemos: 150, thisWeekMemos: 7, thisMonthMemos: 25, streakDays: 14 }

// TOP 10 구절
const topVerses = await analyticsService.getTopVerses('ko', 10);
// [{ book_name: '요한복음', chapter: 3, verse_num: 16, memo_count: 12 }, ...]

// 월별 통계 (차트용)
const monthlyStats = await analyticsService.getMonthlyStats(6);
// [{ month: '2024-12', count: 25 }, { month: '2024-11', count: 30 }, ...]
```

---

## 5. ShareService

> 이미지 생성 및 공유 서비스

### 파일: `src/services/shareService.ts`

```typescript
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { RefObject } from 'react';
import { View } from 'react-native';

type ShareTemplate = 'default' | 'minimal' | 'classic' | 'dark';
type ShareTarget = 'kakaotalk' | 'email' | 'other';

interface ShareCardData {
  reference: string;      // "요한복음 3:16"
  verseText: string;      // 성경 본문
  memoContent?: string;   // 묵상 내용 (선택)
  template: ShareTemplate;
  backgroundColor: string;
}

interface ShareResult {
  success: boolean;
  error?: string;
}

class ShareService {
  /**
   * 공유 카드 이미지 생성
   * @param viewRef - 캡처할 View의 ref
   * @returns 생성된 이미지 파일 URI
   */
  async generateImage(viewRef: RefObject<View>): Promise<string>;

  /**
   * 이미지 공유
   * @param imageUri - 이미지 파일 URI
   * @param target - 공유 대상 (선택)
   */
  async shareImage(imageUri: string, target?: ShareTarget): Promise<ShareResult>;

  /**
   * 텍스트 공유
   * @param text - 공유할 텍스트
   */
  async shareText(text: string): Promise<ShareResult>;

  /**
   * 공유 기능 사용 가능 여부
   */
  async isAvailable(): Promise<boolean>;

  /**
   * 카카오톡 설치 여부 확인
   */
  async isKakaoTalkInstalled(): Promise<boolean>;

  /**
   * 공유 카드 미리보기 데이터 생성
   */
  createShareCardData(
    verse: Verse,
    memo?: Memo,
    template?: ShareTemplate,
    backgroundColor?: string
  ): ShareCardData;
}

export const shareService = new ShareService();
```

### 사용 예시

```typescript
// 공유 카드 뷰를 캡처하여 이미지 생성
const imageUri = await shareService.generateImage(cardRef);

// 이미지 공유
const result = await shareService.shareImage(imageUri);

// 텍스트만 공유
await shareService.shareText(`
요한복음 3:16
하나님이 세상을 이처럼 사랑하사...

나의 묵상:
하나님의 무한하신 사랑을 느낍니다.
`);
```

---

## 6. DatabaseService

> SQLite 데이터베이스 관리 서비스

### 파일: `src/services/database/index.ts`

```typescript
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

class DatabaseService {
  private bibleDb: SQLite.SQLiteDatabase | null = null;
  private userDb: SQLite.SQLiteDatabase | null = null;

  /**
   * 데이터베이스 초기화
   * - Bible.db: Assets에서 복사
   * - User.db: 테이블 생성
   */
  async initialize(): Promise<void>;

  /**
   * Bible DB 인스턴스 반환
   */
  getBibleDb(): SQLite.SQLiteDatabase;

  /**
   * User DB 인스턴스 반환
   */
  getUserDb(): SQLite.SQLiteDatabase;

  /**
   * 트랜잭션 실행
   */
  async runTransaction<T>(
    db: SQLite.SQLiteDatabase,
    callback: () => Promise<T>
  ): Promise<T>;

  /**
   * 데이터베이스 닫기
   */
  async close(): Promise<void>;

  /**
   * User DB 백업 (JSON export)
   */
  async exportUserData(): Promise<string>;

  /**
   * User DB 복원 (JSON import)
   */
  async importUserData(jsonData: string): Promise<void>;

  /**
   * User DB 초기화 (모든 데이터 삭제)
   */
  async resetUserData(): Promise<void>;
}

export const databaseService = new DatabaseService();
```

---

## 에러 코드

```typescript
// src/utils/errorCodes.ts

export enum ErrorCode {
  // Database
  DB_INIT_FAILED = 'DB_001',
  DB_QUERY_FAILED = 'DB_002',
  DB_NOT_FOUND = 'DB_003',
  
  // Auth
  AUTH_INVALID_PASSWORD = 'AUTH_001',
  AUTH_BIOMETRIC_FAILED = 'AUTH_002',
  AUTH_BIOMETRIC_NOT_AVAILABLE = 'AUTH_003',
  
  // Encryption
  ENCRYPT_FAILED = 'ENC_001',
  DECRYPT_FAILED = 'ENC_002',
  KEY_NOT_FOUND = 'ENC_003',
  
  // Share
  SHARE_CAPTURE_FAILED = 'SHARE_001',
  SHARE_NOT_AVAILABLE = 'SHARE_002',
  
  // Validation
  VALIDATION_REQUIRED = 'VAL_001',
  VALIDATION_FORMAT = 'VAL_002',
}

export class AppError extends Error {
  code: ErrorCode;
  
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AppError';
  }
}
```

---

## 서비스 초기화 순서

```typescript
// src/app/App.tsx

async function initializeApp() {
  // 1. 데이터베이스 초기화
  await databaseService.initialize();
  
  // 2. 인증 상태 확인
  const hasPassword = await authService.isPasswordSet();
  
  // 3. 설정 로드
  const settings = await settingsService.getAll();
  
  // 4. 상태 스토어 초기화
  useAppStore.getState().setSettings(settings);
  
  return { hasPassword };
}
```
