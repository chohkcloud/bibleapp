# AI 묵상 피드백 bible_text 저장 + QT탭 UI 개선 + 날짜 표시 수정

> AI 묵상 피드백 여전히 실패하는 근본 원인 수정 (bible_text DB 저장 + bundled 폴백) + QT탭 UI/UX 개선

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 디버그_AI피드백bible_text저장및QT탭UI개선_20260131_1500.md |
| 카테고리 | 디버그 |
| 생성일시 | 2026-01-31 15:00 KST |
| 작성자 | Claude Code |
| 관련 단계 | 19단계 후속 (AI 피드백 근본 수정 + UI 개선) |

---

## 1. 발견된 문제 (스마트폰 테스트)

| # | 증상 | 심각도 |
|---|------|--------|
| 1 | AI 묵상 피드백 "묵상 피드백 받기" 클릭 시 여전히 "성경 본문을 불러올 수 없습니다. 성경 버전을 확인해주세요." 에러 | 높음 |
| 2 | QT탭: 통계 화면(총묵상, 연속일수 등)만 나오고 뒤로가기 불가 | 보통 |
| 3 | 묵상 목록 날짜가 "X시간 전"으로만 표시, 정확한 일시 확인 불가 | 낮음 |

---

## 2. 원인 분석

### 문제 1: AI 묵상 피드백 근본 원인

**파일**: `src/screens/memo/MemoDetailScreen.tsx:74-80`

이전 수정에서 `verse null → 에러 메시지 표시`로 바꿨지만, **근본 원인은 미해결**:

```typescript
// 이전 수정 코드 (여전히 실패)
const verseData = await bibleService.getVerse(bibleVersion, ...);
// bibleVersion = 'korHKJV' (번들 버전) → bibleService는 DB 쿼리 → DB에 없음 → null
```

**원인 체인**:
1. 사용자가 번들 성경 버전 (korHKJV 등) 선택
2. `bibleService.getVerse()` = SQLite DB 쿼리 → 번들 버전은 DB에 없음 (JSON 파일)
3. `verse = null`, `fullVerseText = ''`
4. 에러 메시지 표시 (기능 동작 불가)

**비교**: `MemoEditScreen`에는 `bundledBibleService` 폴백이 있지만 `MemoDetailScreen`에는 없었음.

### 문제 2: QT탭 UI 문제

- QT탭 initialRoute = `MemoListScreen` (묵상 목록) → 정상
- 그러나 HomeScreen에서 "자세히 보기" → `Analytics` 이동 → 탭 스택이 Analytics에 고정
- `AnalyticsScreen`에 뒤로가기 헤더 없음 → 사용자가 갇힘
- 통계 지표(총묵상, 연속일, 이번주, 이번달)를 QT탭에서도 간략히 보고 싶은 요구

### 문제 3: 날짜 표시

- "방금 전", "3시간 전", "어제" 등 상대 시간 → 정확한 작성 일시 확인 불가

---

## 3. 수정 내용

### 수정 1: bible_text DB 저장 + bundled 폴백 (핵심)

**전략**: 메모 생성 시 성경 본문을 `bible_text` 컬럼에 저장 → 피드백 요청 시 저장된 텍스트 우선 사용

#### 1-1. DB 스키마 확장

**파일**: `src/services/database/index.ts`

```typescript
// 마이그레이션 추가
if (!columnNames.includes('bible_text')) {
  await udb.execAsync('ALTER TABLE memos ADD COLUMN bible_text TEXT;');
}
```

#### 1-2. 타입 확장

**파일**: `src/types/database.ts`

```typescript
// Memo 인터페이스에 추가
bible_text?: string | null;      // 생성 시점 성경 본문 (피드백용)

// CreateMemoDto에 추가
bible_text?: string;             // 생성 시점 성경 본문
```

#### 1-3. INSERT 쿼리 확장

**파일**: `src/services/database/memoQueries.ts`

```typescript
// createMemo() INSERT에 bible_text 포함
INSERT INTO memos (..., bible_text, ...) VALUES (..., ?, ...)
```

#### 1-4. 서비스 레이어

**파일**: `src/services/memoService.ts`

```typescript
// CreateMemoInput에 추가
bibleText?: string;     // 생성 시점 성경 본문 (피드백용)

// createMemo() DTO 매핑
bible_text: input.bibleText,
```

#### 1-5. 메모 생성 시 텍스트 저장

**파일**: `src/screens/memo/MemoEditScreen.tsx`

```typescript
// 저장 시 구절 텍스트 합침
let bibleTextForSave = '';
if (verses.length > 1) {
  bibleTextForSave = verses.map(v => v.text).join(' ');
} else if (verse) {
  bibleTextForSave = verse.text;
}

const newMemoId = await memoService.createMemo({
  ...기존파라미터,
  bibleText: bibleTextForSave || undefined,
});
```

#### 1-6. 피드백 요청 시 3중 폴백

**파일**: `src/screens/memo/MemoDetailScreen.tsx`

```typescript
import { bundledBibleService } from '../../services/bundledBibleService';

// getVerseAny: bundled → DB → null 순으로 폴백
const getVerseAny = async (version, bookId, chap, vn) => {
  if (bundledBibleService.isBundled(version)) {
    const bv = bundledBibleService.getVerse(version, bookId, chap, vn);
    if (bv) return { ...bv as Verse };
  }
  return await bibleService.getVerse(version, bookId, chap, vn);
};

// 구절 로드: 현재 버전 → 저장 시점 버전 → KRV 폴백
let verseData = await getVerseAny(bibleVersion, ...);
if (!verseData && memoData.bible_id !== bibleVersion)
  verseData = await getVerseAny(memoData.bible_id, ...);
if (!verseData)
  verseData = await getVerseAny('KRV', ...);

// fullVerseText: memo.bible_text → fetched text 순으로 폴백
if (memoData.bible_text) {
  setFullVerseText(memoData.bible_text);   // DB 저장된 텍스트 우선
} else if (memoData.verse_range && ...) {
  // 범위 구절 합침 (3중 폴백)
} else if (verseData) {
  setFullVerseText(verseData.text);
}
```

### 수정 2: QT탭 UI 개선

#### 2-1. MemoListScreen 콤팩트 통계

**파일**: `src/screens/memo/MemoListScreen.tsx`

- `analyticsService` import 추가
- `stats` state 추가 (totalMemos, streakDays, thisWeekMemos, thisMonthMemos)
- 필터 헤더 아래에 콤팩트 통계 바 추가 (총묵상 | 연속일 | 이번주 | 이번달)

#### 2-2. AnalyticsScreen 뒤로가기 헤더

**파일**: `src/screens/memo/AnalyticsScreen.tsx`

- `navigation` props 추가 (NativeStackScreenProps)
- 뒤로가기 버튼 + "묵상 통계" 헤더 추가

### 수정 3: 날짜 표시 절대 형식

**파일**: `MemoListScreen.tsx`, `HomeScreen.tsx`

```typescript
// Before: 상대 시간
if (diffHours < 1) return '방금 전';
if (diffHours < 24) return `${diffHours}시간 전`;

// After: 절대 날짜/시간
return `${y}.${m}.${d} ${h}:${min}`;  // 예: 2026.01.31 15:00
```

---

## 4. 변경 파일 요약

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `src/services/database/index.ts` | `bible_text` 컬럼 마이그레이션 추가 |
| 2 | `src/types/database.ts` | `Memo`, `CreateMemoDto`에 `bible_text` 필드 추가 |
| 3 | `src/services/database/memoQueries.ts` | `createMemo()` INSERT에 `bible_text` 포함 |
| 4 | `src/services/memoService.ts` | `CreateMemoInput`에 `bibleText` 추가 |
| 5 | `src/screens/memo/MemoEditScreen.tsx` | 저장 시 구절 텍스트를 `bibleText`로 전달 |
| 6 | `src/screens/memo/MemoDetailScreen.tsx` | `bundledBibleService` 폴백 + `memo.bible_text` 우선 사용 |
| 7 | `src/screens/memo/MemoListScreen.tsx` | 콤팩트 통계 요약 + 날짜 절대 형식 변경 |
| 8 | `src/screens/memo/AnalyticsScreen.tsx` | 뒤로가기 헤더 추가 |
| 9 | `src/screens/home/HomeScreen.tsx` | 날짜 절대 형식 변경 |

---

## 5. 기존 메모 하위호환성

| 상황 | 동작 |
|------|------|
| 새로 생성되는 메모 | `bible_text` 컬럼에 성경 본문 저장 → 항상 피드백 가능 |
| 기존 메모 (bible_text = NULL) | `bundledBibleService` → `bibleService` → KRV 폴백으로 구절 로드 시도 |
| 어떤 버전으로도 조회 불가 시 | 에러 메시지 표시 (기존과 동일) |

---

## 6. 빌드 정보

- **TypeScript**: 신규 에러 없음 (기존 null 가능성 경고만 존재)
- **커밋/빌드**: 문서 작성 후 진행 예정
