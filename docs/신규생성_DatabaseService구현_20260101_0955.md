# DatabaseService 구현 완료 보고서

> 3단계 작업 완료 문서

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 신규생성_DatabaseService구현_20260101_0955.md |
| 카테고리 | 신규생성 |
| 생성일시 | 2026-01-01 09:55 KST |
| 작성자 | Claude |
| 버전 | v1.0.0 |

---

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 작업 단계 | 3단계: DatabaseService 구현 |
| 참조 문서 | DATABASE.md |
| 작업 시작 | 20260101_0949 |
| 작업 완료 | 20260101_0955 |

---

## 2. 생성 파일 목록

### 2.1 타입 정의

| # | 파일 경로 | 설명 |
|---|----------|------|
| 1 | `src/types/database.ts` | 데이터베이스 엔티티 및 DTO 타입 정의 |

**정의된 타입:**
- `Language` - 언어 정보
- `Bible` - 성경 버전 정보
- `Book` - 성경 책 정보
- `BookName` - 언어별 책 이름
- `Verse` - 성경 구절
- `VerseWithMeta` - 메모/하이라이트 포함 구절
- `Memo` - 메모 엔티티
- `MemoTag` - 태그 엔티티
- `Bookmark` - 북마크 엔티티
- `Highlight` - 하이라이트 엔티티
- `Setting` - 설정 엔티티
- `SearchResult` - 검색 결과
- `TopVerse`, `DailyStat`, `MonthlyStat` - 통계 타입
- `CreateMemoDto`, `UpdateMemoDto` 등 - DTO 타입들

### 2.2 데이터베이스 서비스

| # | 파일 경로 | 설명 |
|---|----------|------|
| 1 | `src/services/database/index.ts` | DatabaseService 클래스 |

**주요 기능:**
- `initialize()` - 데이터베이스 초기화
- `getBibleDb()` - Bible.db 인스턴스 반환
- `getUserDb()` - User.db 인스턴스 반환

**스키마 생성:**
- Bible.db: languages, bibles, books, book_names, verses, verses_fts(FTS5)
- User.db: memos, memo_tags, memo_tag_map, bookmarks, highlights, settings

### 2.3 쿼리 함수

| # | 파일 경로 | 설명 |
|---|----------|------|
| 1 | `src/services/database/bibleQueries.ts` | 성경 관련 쿼리 |
| 2 | `src/services/database/memoQueries.ts` | 메모/북마크/하이라이트 쿼리 |
| 3 | `src/services/database/settingsQueries.ts` | 설정 관련 쿼리 |

### 2.4 통합 Export

| # | 파일 경로 | 설명 |
|---|----------|------|
| 1 | `src/services/index.ts` | 서비스 레이어 통합 export |

---

## 3. 구현 상세

### 3.1 bibleQueries.ts 함수 목록

| 함수명 | 설명 |
|--------|------|
| `getLanguages()` | 활성화된 언어 목록 조회 |
| `getBiblesByLanguage(langId)` | 특정 언어의 성경 버전 목록 |
| `getAllBibles()` | 모든 성경 버전 조회 |
| `getBibleById(bibleId)` | 성경 버전 상세 조회 |
| `getBooks()` | 모든 책 목록 조회 |
| `getBooksByTestament(testament)` | 구약/신약별 책 목록 |
| `getBookNames(langId)` | 특정 언어의 책 이름 목록 |
| `getBooksWithNames(langId)` | 책 정보 + 이름 조회 |
| `getChapterVerses(bibleId, bookId, chapter)` | 특정 장 전체 구절 |
| `getChapterVersesWithMeta(...)` | 구절 + 메모/하이라이트 정보 |
| `getVerse(bibleId, bookId, chapter, verseNum)` | 특정 구절 조회 |
| `getVerseById(verseId)` | 구절 ID로 조회 |
| `searchVerses(bibleId, query, langId, limit)` | FTS5 전문 검색 |
| `searchVersesSimple(bibleId, query, langId, limit)` | LIKE 검색 |
| `getBookChapterCount(bookId)` | 책의 총 장 수 |
| `getChapterVerseCount(bibleId, bookId, chapter)` | 장의 총 절 수 |

### 3.2 memoQueries.ts 함수 목록

**메모 CRUD:**
| 함수명 | 설명 |
|--------|------|
| `createMemo(dto)` | 메모 생성 |
| `updateMemo(memoId, dto)` | 메모 수정 |
| `deleteMemo(memoId)` | 메모 삭제 (Soft Delete) |
| `permanentDeleteMemo(memoId)` | 메모 영구 삭제 |
| `getMemoById(memoId)` | 메모 ID로 조회 |
| `getMemosByVerse(...)` | 구절별 메모 목록 |
| `getAllMemos(limit, offset)` | 모든 메모 목록 |
| `getMemosByTag(tagId)` | 태그별 메모 조회 |

**태그 CRUD:**
| 함수명 | 설명 |
|--------|------|
| `createTag(dto)` | 태그 생성 |
| `getAllTags()` | 모든 태그 조회 |
| `deleteTag(tagId)` | 태그 삭제 |

**북마크 CRUD:**
| 함수명 | 설명 |
|--------|------|
| `createBookmark(dto)` | 북마크 생성 |
| `deleteBookmark(bookmarkId)` | 북마크 삭제 |
| `getAllBookmarks()` | 모든 북마크 조회 |
| `getBookmarkByVerse(...)` | 구절별 북마크 확인 |

**하이라이트 CRUD:**
| 함수명 | 설명 |
|--------|------|
| `createHighlight(dto)` | 하이라이트 생성 |
| `deleteHighlight(highlightId)` | 하이라이트 삭제 |
| `deleteHighlightByVerse(verseId)` | 구절별 삭제 |
| `getHighlightsByChapter(...)` | 장별 하이라이트 조회 |

**통계/분석:**
| 함수명 | 설명 |
|--------|------|
| `getTopVerses(langId, limit)` | 자주 묵상한 구절 TOP N |
| `getDailyStats(days)` | 일별 묵상 통계 |
| `getMonthlyStats(months)` | 월별 묵상 통계 |
| `getTotalMemoCount()` | 총 메모 개수 |
| `getTotalBookmarkCount()` | 총 북마크 개수 |

### 3.3 settingsQueries.ts 함수 목록

**설정 키 상수:**
- `THEME` - 테마 (light/dark)
- `FONT_SIZE` - 폰트 크기
- `DEFAULT_BIBLE` - 기본 성경 버전
- `LANGUAGE` - 언어
- `AUTO_LOCK_MINUTES` - 자동 잠금 시간

**기본 CRUD:**
| 함수명 | 설명 |
|--------|------|
| `getSetting(key)` | 설정 값 조회 |
| `setSetting(key, value)` | 설정 값 저장/업데이트 |
| `getAllSettings()` | 모든 설정 조회 |
| `deleteSetting(key)` | 설정 삭제 |

**편의 함수:**
| 함수명 | 설명 |
|--------|------|
| `getTheme()` / `setTheme(theme)` | 테마 조회/설정 |
| `getFontSize()` / `setFontSize(size)` | 폰트 크기 조회/설정 |
| `getDefaultBible()` / `setDefaultBible(bibleId)` | 기본 성경 조회/설정 |
| `getLanguage()` / `setLanguage(langId)` | 언어 조회/설정 |
| `getAutoLockMinutes()` / `setAutoLockMinutes(minutes)` | 자동 잠금 조회/설정 |

---

## 4. 샘플 데이터

### 4.1 언어
- 한국어 (ko)
- English (en)

### 4.2 성경 버전
- KRV (개역한글)
- NIV (New International Version)

### 4.3 책 (66권 전체 정의)
- 구약 39권: 창세기 ~ 말라기
- 신약 27권: 마태복음 ~ 요한계시록

### 4.4 샘플 구절
- 창세기 1장 1-31절 (KRV)
- 요한복음 3장 1-21절 (KRV)

---

## 5. 특이사항

### 5.1 FTS5 전문검색
- `verses_fts` 가상 테이블 생성
- 한글 형태소 분석을 위한 trigram tokenizer 사용
- `searchVerses()` 함수에서 MATCH 쿼리 활용

### 5.2 Soft Delete
- 메모는 `is_deleted` 플래그로 Soft Delete 구현
- `permanentDeleteMemo()`로 완전 삭제 가능

### 5.3 암호화 플래그
- 메모 생성 시 `is_encrypted = 1` 기본값
- 실제 암호화 로직은 4단계(서비스 레이어)에서 구현 예정

---

## 6. 다음 단계

| 항목 | 내용 |
|------|------|
| 다음 단계 | 4단계: 서비스 레이어 구현 |
| 참조 문서 | API.md |
| 주요 작업 | AuthService, BibleService, MemoService, AnalyticsService, ShareService 구현 |
| 추가 작업 | 암호화 유틸리티, 에러 코드 정의, 커스텀 훅 구현 |

---

## 문서 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-01 09:55 | v1.0.0 | 최초 작성 | Claude |
