// src/utils/bibleRefParser.ts
// 성경 구절 참조 파싱 유틸리티
// 지원 패턴:
// - "요한복음3장1절~16절"
// - "요한복음 3:1-16"
// - "요3:16" (약어)
// - "창세기1장1절~5절"

import { allBooks, BookMetadata } from '../data/bibleMetadata';

export interface ParsedBibleRef {
  bookId: number;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  verseRange?: string;      // 비연속 구절
  rawText: string;
  startIndex: number;
  endIndex: number;
}

// 책 이름 → bookId 매핑 (정규 이름 + 약어)
const BOOK_NAME_MAP: Record<string, number> = {};

// 초기화: 책 이름 매핑 구축
allBooks.forEach((book: BookMetadata) => {
  // 한글 정식 이름
  BOOK_NAME_MAP[book.koreanName] = book.bookId;
  // 한글 약어
  BOOK_NAME_MAP[book.koreanAbbrev] = book.bookId;
  // 영어 이름 (소문자)
  BOOK_NAME_MAP[book.englishName.toLowerCase()] = book.bookId;
  // 영어 약어 (소문자)
  BOOK_NAME_MAP[book.englishAbbrev.toLowerCase()] = book.bookId;
});

// 한글 책 이름 목록 (정규식용)
const KOREAN_BOOK_NAMES = allBooks.map(b => b.koreanName).join('|');

// 한글 약어 목록 (정규식용)
const KOREAN_ABBREVS = allBooks.map(b => b.koreanAbbrev).join('|');

// 정규식 패턴들
const PATTERNS = [
  // 패턴 1: "요한복음3장1절~16절", "창세기1장1절"
  new RegExp(
    `(${KOREAN_BOOK_NAMES})\\s*(\\d+)장\\s*(\\d+)절(?:[~-](\\d+)절)?`,
    'g'
  ),

  // 패턴 2: "요한복음 3:1-16", "창세기 1:1"
  new RegExp(
    `(${KOREAN_BOOK_NAMES})\\s*(\\d+):(\\d+)(?:-(\\d+))?`,
    'g'
  ),

  // 패턴 3: "요3:16", "창1:1-5" (약어)
  new RegExp(
    `(${KOREAN_ABBREVS})\\s*(\\d+):(\\d+)(?:-(\\d+))?`,
    'g'
  ),
];

/**
 * 텍스트에서 성경 구절 참조 파싱
 * @param text 파싱할 텍스트
 * @returns 파싱된 성경 참조 배열
 */
export function parseBibleReferences(text: string): ParsedBibleRef[] {
  const refs: ParsedBibleRef[] = [];
  const foundPositions = new Set<string>();

  for (const pattern of PATTERNS) {
    let match;
    // 정규식 lastIndex 초기화
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const bookName = match[1];
      const chapter = parseInt(match[2], 10);
      const verseStart = parseInt(match[3], 10);
      const verseEnd = match[4] ? parseInt(match[4], 10) : verseStart;

      const bookId = BOOK_NAME_MAP[bookName];

      if (bookId) {
        // 중복 위치 체크
        const posKey = `${match.index}-${match.index + match[0].length}`;
        if (!foundPositions.has(posKey)) {
          foundPositions.add(posKey);

          const book = allBooks.find(b => b.bookId === bookId);
          refs.push({
            bookId,
            bookName: book?.koreanName || bookName,
            chapter,
            verseStart,
            verseEnd,
            rawText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          });
        }
      }
    }
  }

  // 위치 순 정렬
  return refs.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * 구절 범위 문자열 파싱 (예: "1-16", "1,3,5-10")
 * @param range 구절 범위 문자열
 * @returns 구절 번호 배열
 */
export function parseVerseRange(range: string): number[] {
  const verses: number[] = [];
  const parts = range.split(',').map(p => p.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          verses.push(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        verses.push(num);
      }
    }
  }

  return [...new Set(verses)].sort((a, b) => a - b);
}

/**
 * 구절 배열을 범위 문자열로 변환 (예: [1,2,3,5,7,8,9] -> "1-3,5,7-9")
 * @param verses 구절 번호 배열
 * @returns 구절 범위 문자열
 */
export function versesToRangeString(verses: number[]): string {
  if (verses.length === 0) return '';

  const sorted = [...new Set(verses)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    if (i < sorted.length && sorted[i] === rangeEnd + 1) {
      rangeEnd = sorted[i];
    } else {
      ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
      if (i < sorted.length) {
        rangeStart = sorted[i];
        rangeEnd = sorted[i];
      }
    }
  }

  return ranges.join(',');
}

/**
 * 책 이름으로 bookId 찾기
 * @param name 책 이름 또는 약어
 * @returns bookId 또는 undefined
 */
export function getBookIdByName(name: string): number | undefined {
  return BOOK_NAME_MAP[name] || BOOK_NAME_MAP[name.toLowerCase()];
}

/**
 * bookId로 한글 책 이름 가져오기
 * @param bookId 책 ID
 * @returns 한글 책 이름
 */
export function getBookNameById(bookId: number): string {
  const book = allBooks.find(b => b.bookId === bookId);
  return book?.koreanName || `${bookId}권`;
}
