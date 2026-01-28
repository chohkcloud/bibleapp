/**
 * Dictionary Types
 * 사전 관련 타입 정의
 */

// Strong's 사전 항목
export interface StrongEntry {
  num: string;              // "H1", "G3056" 등 (H=히브리어, G=헬라어)
  original: string;         // 원어 로마자 음역
  transliteration: string;  // 음역 (영문 알파벳)
  pronunciation: string;    // 발음 기호 (예: "awb")
  pronunciationKo: string;  // 한글 발음 (예: "아브")
  meaning: string;          // 영문 의미
  meaningKo: string;        // 한글 의미
  usage?: string;           // 용례 및 상세 설명
  related?: string[];       // 관련 Strong 번호
}

// 성경 사전 항목
export interface DictEntry {
  id: number;               // 고유 ID
  term: string;             // 표제어 (한글)
  termEn?: string;          // 표제어 (영문)
  category: DictCategory;   // 분류
  definition: string;       // 정의/설명
  shortMeaning?: string;    // 짧은 의미 요약 (검색 결과 표시용)
  references?: string[];    // 관련 성경 구절 (예: ["창1:1", "요1:1"])
  related?: string[];       // 관련 항목 (다른 표제어)
}

// 사전 항목 분류
export type DictCategory =
  | '인물'      // Person
  | '지명'      // Place
  | '개념'      // Concept/Doctrine
  | '사물'      // Object
  | '동식물'    // Animal/Plant
  | '관습'      // Custom/Practice
  | '기타';     // Other

// 단어-Strong 매핑 (성경 본문의 각 단어에 Strong 번호 연결)
export interface WordStrongMapping {
  bookId: number;           // 책 ID (1-66)
  chapter: number;          // 장
  verse: number;            // 절
  wordIndex: number;        // 절 내 단어 위치 (0-based)
  word: string;             // 한글 단어
  strongNum: string;        // Strong 번호 ("H1234" 또는 "G5678")
}

// 선택된 단어 정보 (UI 상태용)
export interface SelectedWord {
  word: string;             // 선택된 단어
  strongNum?: string;       // Strong 번호 (있을 경우)
  bookId: number;
  chapter: number;
  verse: number;
  wordIndex: number;
  position: {               // 화면상 위치 (팝오버용)
    x: number;
    y: number;
  };
}

// 비교 성경 버전 타입
export type ParallelVersionType =
  | 'hcv'       // 개역한글
  | 'hkj'       // 개역개정
  | 'hml'       // 현대인의 성경
  | 'hrv'       // 공동번역
  | 'hsn'       // 새번역
  | 'kjv'       // King James Version (영어)
  | 'niv'       // NIV (영어)
  | 'asv'       // ASV (영어)
  | 'nas'       // NASB (영어)
  | 'jpm'       // 일본어
  | 'hstrong'   // 한글 + 히브리어 Strong
  | 'gstrong';  // 한글 + 헬라어 Strong

// 비교 성경 절 데이터
export interface ParallelVerse {
  version: ParallelVersionType;
  versionName: string;      // 표시 이름 (예: "개역한글", "KJV")
  text: string;             // 절 본문
  strongWords?: StrongWord[]; // Strong 번호가 있는 경우 단어별 정보
}

// Strong 번호가 연결된 단어
export interface StrongWord {
  text: string;             // 단어 텍스트
  strongNum?: string;       // Strong 번호
  original?: string;        // 원어
  transliteration?: string; // 음역
}

// 통합 검색 결과
export interface UnifiedSearchResult {
  verses: VerseSearchResult[];
  dictionary: DictEntry[];
  strongH: StrongEntry[];
  strongG: StrongEntry[];
}

// 성경 검색 결과 (기존 타입 확장)
export interface VerseSearchResult {
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
  bookName: string;
  highlight?: {             // 검색어 하이라이트 위치
    start: number;
    end: number;
  }[];
}

// 사전 Store 상태
export interface DictionaryState {
  // 현재 조회 중인 항목
  currentDictEntry: DictEntry | null;
  currentStrongEntry: StrongEntry | null;

  // 검색 결과
  dictSearchResults: DictEntry[];
  strongSearchResults: StrongEntry[];

  // 최근 검색/조회
  recentSearches: string[];
  recentStrong: string[];     // 최근 조회한 Strong 번호

  // 즐겨찾기
  favoriteDictTerms: string[];
  favoriteStrongNums: string[];

  // 로딩 상태
  isLoading: boolean;
  error: string | null;
}

// 사전 Store 액션
export interface DictionaryActions {
  // 검색
  searchDictionary: (query: string) => Promise<void>;
  searchStrong: (query: string, lang: 'H' | 'G') => Promise<void>;

  // 조회
  getDictEntry: (term: string) => Promise<void>;
  getStrongEntry: (num: string) => Promise<void>;

  // 즐겨찾기
  toggleFavoriteTerm: (term: string) => void;
  toggleFavoriteStrong: (num: string) => void;

  // 초기화
  clearResults: () => void;
  clearError: () => void;
}

// 버전 이름 매핑 상수
export const VERSION_DISPLAY_NAMES: Record<ParallelVersionType, string> = {
  hcv: '개역한글',
  hkj: '개역개정',
  hml: '현대인의 성경',
  hrv: '공동번역',
  hsn: '새번역',
  kjv: 'KJV (영어)',
  niv: 'NIV (영어)',
  asv: 'ASV (영어)',
  nas: 'NASB (영어)',
  jpm: '日本語',
  hstrong: '히브리어 원문',
  gstrong: '헬라어 원문',
};

// 비교 성경 조합 프리셋
export const PARALLEL_PRESETS = {
  koEn: ['hcv', 'kjv'] as ParallelVersionType[],           // 한/영
  koJp: ['hcv', 'jpm'] as ParallelVersionType[],           // 한/일
  jpEn: ['jpm', 'kjv'] as ParallelVersionType[],           // 일/영
  koStrong: ['hcv', 'hstrong'] as ParallelVersionType[],   // 한/히(Strong)
  koGreek: ['hcv', 'gstrong'] as ParallelVersionType[],    // 한/헬(Strong)
  all: ['hcv', 'kjv', 'jpm'] as ParallelVersionType[],     // 한/영/일
};
