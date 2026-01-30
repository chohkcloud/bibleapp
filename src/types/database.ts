// src/types/database.ts
// 데이터베이스 엔티티 타입 정의

// ============================================
// Bible.db 테이블 타입 (읽기전용)
// ============================================

export interface Language {
  lang_id: string;        // 'ko', 'en', 'ja'
  lang_name: string;      // '한국어', 'English', '日本語'
  is_active: number;      // 1: 활성, 0: 비활성
}

export interface Bible {
  bible_id: string;       // 'KRV', 'NIV', 'KJV', 'JPN'
  lang_id: string;        // FK → languages
  version_name: string;   // '개역한글', 'NIV', '口語訳'
  version_abbr: string;   // '개역', 'NIV', '口語'
  copyright: string | null;
}

export interface Book {
  book_id: number;        // 1-66
  book_code: string;      // 'GEN', 'EXO', ... 'REV'
  testament: 'OT' | 'NT'; // 구약 | 신약
  total_chapters: number; // 총 장 수
}

export interface BookName {
  book_id: number;        // FK → books
  lang_id: string;        // FK → languages
  book_name: string;      // '창세기', 'Genesis', '創世記'
  abbrev: string | null;  // '창', 'Gen', '創'
}

export interface Verse {
  verse_id: number;
  bible_id: string;       // FK → bibles
  book_id: number;        // FK → books
  chapter: number;        // 장 번호
  verse_num: number;      // 절 번호
  text: string;           // 성경 본문
}

// 확장 타입: 메타데이터 포함
export interface VerseWithMeta extends Verse {
  memo_count: number;
  highlight_color: string | null;
  book_name?: string;
}

// ============================================
// User.db 테이블 타입 (읽기/쓰기)
// ============================================

export interface Memo {
  memo_id: string;        // UUID
  id: string;             // memo_id 별칭 (호환성)
  verse_id: number;       // FK → verses (대표 구절)
  bible_id: string;       // 작성 시점 성경 버전
  book_id: number;
  chapter: number;
  verse_num: number;      // 기존 호환 (시작 절)
  verse_start?: number;   // 다중 구절: 시작 절
  verse_end?: number;     // 다중 구절: 끝 절
  verse_range?: string | null;  // 다중 구절: 범위 문자열 ("1-16", "1,3,5-10")
  content: string;        // 암호화된 메모 내용
  is_encrypted: number;   // 1: 암호화됨
  created_at: string;     // ISO 8601
  updated_at: string;
  is_deleted: number;     // Soft delete
  tags?: string;          // JOIN 결과
  emotion_data?: string | null;    // AI 감정분석 결과 JSON
  feedback_data?: string | null;   // AI 묵상 피드백 결과 JSON
}

export interface MemoTag {
  tag_id: number;
  tag_name: string;
  color: string;          // Hex color
  created_at: string;
}

export interface MemoTagMap {
  memo_id: string;
  tag_id: number;
}

export interface Bookmark {
  bookmark_id: string;    // UUID
  verse_id?: number;      // 구절 ID
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number | null; // NULL이면 장 전체 북마크
  title: string | null;   // 선택적 제목
  created_at: string;
}

export interface Highlight {
  highlight_id: string;   // UUID
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  color: string;          // 하이라이트 색상
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// ============================================
// 통계/분석 타입
// ============================================

export interface TopVerse {
  book_id: number;
  bookId: number;         // book_id 별칭
  chapter: number;
  verse_num: number;
  verseNum: number;       // verse_num 별칭
  book_name: string;
  bookName: string;       // book_name 별칭
  memo_count: number;
  count: number;          // memo_count 별칭
}

export interface DailyStat {
  date: string;           // YYYY-MM-DD
  count: number;
}

export interface MonthlyStat {
  month: string;          // YYYY-MM
  count: number;
}

// ============================================
// 검색 결과 타입
// ============================================

export interface SearchResult extends Verse {
  book_name: string;
  rank?: number;
}

// ============================================
// 생성/수정용 DTO 타입
// ============================================

export interface CreateMemoDto {
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  verse_start?: number;    // 다중 구절: 시작 절
  verse_end?: number;      // 다중 구절: 끝 절
  verse_range?: string;    // 다중 구절: 범위 문자열
  content: string;
  tags?: number[];
}

export interface UpdateMemoDto {
  content?: string;
  tags?: number[] | string;
}

export interface CreateBookmarkDto {
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num?: number;
  title?: string;
}

export interface CreateHighlightDto {
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  color?: string;
}

export interface CreateTagDto {
  tag_name: string;
  color?: string;
}

// ============================================
// 다중 성경 버전 지원 타입
// ============================================

/** 사용 가능한 성경 버전 정보 */
export interface BibleVersionInfo {
  id: string;              // 'KRV', 'KJV', 'NIV'
  name: string;            // '개역한글', 'King James Version'
  nameLocal: string;       // 현지어 이름
  language: string;        // 'ko', 'en', 'ja'
  languageName: string;    // '한국어', 'English', '日本語'
  copyright: string;       // 저작권 정보
  description?: string;    // 버전 설명
  size: number;            // 다운로드 크기 (bytes)
  verseCount: number;      // 총 구절 수
  isDownloaded: boolean;   // 다운로드 완료 여부
  isBundled: boolean;      // 앱 번들 포함 여부
  apiEndpoint?: string;    // API 다운로드 URL
}

/** 다운로드 진행 상태 */
export interface DownloadProgress {
  versionId: string;
  progress: number;        // 0-100
  downloadedBytes: number;
  totalBytes: number;
  status: DownloadStatus;
  error?: string;
}

export type DownloadStatus =
  | 'pending'      // 대기 중
  | 'downloading'  // 다운로드 중
  | 'processing'   // DB 삽입 중
  | 'completed'    // 완료
  | 'error'        // 에러
  | 'cancelled';   // 취소됨

/** 다운로드된 버전 DB 테이블 타입 */
export interface DownloadedVersion {
  bible_id: string;
  downloaded_at: string;   // ISO 8601
  file_size: number;
  verse_count: number;
  is_bundled: number;      // 1: 번들, 0: 다운로드
  last_used_at: string;    // ISO 8601
}

/** API 응답용 성경 데이터 */
export interface BibleDataResponse {
  version: {
    id: string;
    name: string;
    language: string;
  };
  books: Array<{
    bookId: number;
    name: string;
    chapters: Array<{
      chapter: number;
      verses: Array<{
        verse: number;
        text: string;
      }>;
    }>;
  }>;
}
