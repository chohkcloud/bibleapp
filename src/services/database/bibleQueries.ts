// src/services/database/bibleQueries.ts
// 성경 관련 쿼리 함수

import { Platform } from 'react-native';
import { databaseService } from './index';
import type {
  Language,
  Bible,
  Book,
  BookName,
  Verse,
  VerseWithMeta,
  SearchResult,
} from '../../types/database';

const isWeb = Platform.OS === 'web';

// ============================================
// 웹용 목업 데이터
// ============================================

const MOCK_LANGUAGES: Language[] = [
  { lang_id: 'ko', lang_name: '한국어', is_active: 1 },
];

const MOCK_BIBLES: Bible[] = [
  { bible_id: 'KRV', lang_id: 'ko', version_name: '개역한글', version_abbr: '개역', copyright: '대한성서공회' },
];

const MOCK_BOOKS: (Book & { book_name: string; abbrev: string | null })[] = [
  { book_id: 1, book_code: 'GEN', testament: 'OT', total_chapters: 50, book_name: '창세기', abbrev: '창' },
  { book_id: 2, book_code: 'EXO', testament: 'OT', total_chapters: 40, book_name: '출애굽기', abbrev: '출' },
  { book_id: 3, book_code: 'LEV', testament: 'OT', total_chapters: 27, book_name: '레위기', abbrev: '레' },
  { book_id: 4, book_code: 'NUM', testament: 'OT', total_chapters: 36, book_name: '민수기', abbrev: '민' },
  { book_id: 5, book_code: 'DEU', testament: 'OT', total_chapters: 34, book_name: '신명기', abbrev: '신' },
  { book_id: 40, book_code: 'MAT', testament: 'NT', total_chapters: 28, book_name: '마태복음', abbrev: '마' },
  { book_id: 41, book_code: 'MRK', testament: 'NT', total_chapters: 16, book_name: '마가복음', abbrev: '막' },
  { book_id: 42, book_code: 'LUK', testament: 'NT', total_chapters: 24, book_name: '누가복음', abbrev: '눅' },
  { book_id: 43, book_code: 'JHN', testament: 'NT', total_chapters: 21, book_name: '요한복음', abbrev: '요' },
  { book_id: 44, book_code: 'ACT', testament: 'NT', total_chapters: 28, book_name: '사도행전', abbrev: '행' },
];

const MOCK_BOOK_NAMES: BookName[] = MOCK_BOOKS.map(b => ({
  book_id: b.book_id,
  lang_id: 'ko',
  book_name: b.book_name,
  abbrev: b.abbrev,
}));

const MOCK_VERSES: Verse[] = [
  { verse_id: 1, bible_id: 'KRV', book_id: 1, chapter: 1, verse_num: 1, text: '태초에 하나님이 천지를 창조하시니라' },
  { verse_id: 2, bible_id: 'KRV', book_id: 1, chapter: 1, verse_num: 2, text: '땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라' },
  { verse_id: 3, bible_id: 'KRV', book_id: 1, chapter: 1, verse_num: 3, text: '하나님이 이르시되 빛이 있으라 하시니 빛이 있었고' },
  { verse_id: 4, bible_id: 'KRV', book_id: 1, chapter: 1, verse_num: 4, text: '빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사' },
  { verse_id: 5, bible_id: 'KRV', book_id: 1, chapter: 1, verse_num: 5, text: '빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라' },
  { verse_id: 100, bible_id: 'KRV', book_id: 43, chapter: 1, verse_num: 1, text: '태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라' },
  { verse_id: 101, bible_id: 'KRV', book_id: 43, chapter: 1, verse_num: 2, text: '그가 태초에 하나님과 함께 계셨고' },
  { verse_id: 102, bible_id: 'KRV', book_id: 43, chapter: 1, verse_num: 3, text: '만물이 그로 말미암아 지은 바 되었으니 지은 것이 하나도 그가 없이는 된 것이 없느니라' },
  { verse_id: 200, bible_id: 'KRV', book_id: 43, chapter: 3, verse_num: 16, text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라' },
];

/**
 * 모든 언어 목록 조회
 */
export async function getLanguages(): Promise<Language[]> {
  if (isWeb) return MOCK_LANGUAGES;
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Language>(
    'SELECT * FROM languages WHERE is_active = 1'
  );
}

/**
 * 특정 언어의 성경 버전 목록 조회
 */
export async function getBiblesByLanguage(langId: string): Promise<Bible[]> {
  if (isWeb) return MOCK_BIBLES.filter(b => b.lang_id === langId);
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Bible>(
    'SELECT * FROM bibles WHERE lang_id = ?',
    [langId]
  );
}

/**
 * 모든 성경 버전 조회
 */
export async function getAllBibles(): Promise<Bible[]> {
  if (isWeb) return MOCK_BIBLES;
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Bible>('SELECT * FROM bibles');
}

/**
 * 성경 버전 상세 조회
 */
export async function getBibleById(bibleId: string): Promise<Bible | null> {
  if (isWeb) return MOCK_BIBLES.find(b => b.bible_id === bibleId) ?? null;
  const db = databaseService.getBibleDb();
  return await db.getFirstAsync<Bible>(
    'SELECT * FROM bibles WHERE bible_id = ?',
    [bibleId]
  );
}

/**
 * 모든 책 목록 조회
 */
export async function getBooks(): Promise<Book[]> {
  if (isWeb) return MOCK_BOOKS;
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Book>(
    'SELECT * FROM books ORDER BY book_id'
  );
}

/**
 * 구약/신약별 책 목록 조회
 */
export async function getBooksByTestament(testament: 'OT' | 'NT'): Promise<Book[]> {
  if (isWeb) return MOCK_BOOKS.filter(b => b.testament === testament);
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Book>(
    'SELECT * FROM books WHERE testament = ? ORDER BY book_id',
    [testament]
  );
}

/**
 * 특정 언어의 책 이름 목록 조회
 */
export async function getBookNames(langId: string): Promise<BookName[]> {
  if (isWeb) return MOCK_BOOK_NAMES.filter(b => b.lang_id === langId);
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<BookName>(
    'SELECT * FROM book_names WHERE lang_id = ? ORDER BY book_id',
    [langId]
  );
}

/**
 * 책 이름과 함께 책 정보 조회
 */
export async function getBooksWithNames(langId: string): Promise<(Book & { book_name: string; abbrev: string | null })[]> {
  if (isWeb) return MOCK_BOOKS;
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Book & { book_name: string; abbrev: string | null }>(
    `SELECT b.*, bn.book_name, bn.abbrev
     FROM books b
     LEFT JOIN book_names bn ON b.book_id = bn.book_id AND bn.lang_id = ?
     ORDER BY b.book_id`,
    [langId]
  );
}

/**
 * 특정 장 전체 구절 조회
 */
export async function getChapterVerses(
  bibleId: string,
  bookId: number,
  chapter: number
): Promise<Verse[]> {
  if (isWeb) {
    return MOCK_VERSES.filter(
      v => v.bible_id === bibleId && v.book_id === bookId && v.chapter === chapter
    );
  }
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Verse>(
    `SELECT * FROM verses
     WHERE bible_id = ? AND book_id = ? AND chapter = ?
     ORDER BY verse_num`,
    [bibleId, bookId, chapter]
  );
}

/**
 * 특정 장 구절 조회 (메모/하이라이트 정보 포함)
 */
export async function getChapterVersesWithMeta(
  bibleId: string,
  bookId: number,
  chapter: number
): Promise<VerseWithMeta[]> {
  if (isWeb) {
    const verses = MOCK_VERSES.filter(
      v => v.bible_id === bibleId && v.book_id === bookId && v.chapter === chapter
    );
    return verses.map(v => ({ ...v, memo_count: 0, highlight_color: null }));
  }

  const bibleDb = databaseService.getBibleDb();
  const userDb = databaseService.getUserDb();

  // 먼저 구절 조회
  const verses = await bibleDb.getAllAsync<Verse>(
    `SELECT * FROM verses
     WHERE bible_id = ? AND book_id = ? AND chapter = ?
     ORDER BY verse_num`,
    [bibleId, bookId, chapter]
  );

  // 메모 및 하이라이트 정보 조회
  const versesWithMeta: VerseWithMeta[] = await Promise.all(
    verses.map(async (verse) => {
      // 메모 개수 조회
      const memoResult = await userDb.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM memos
         WHERE verse_id = ? AND is_deleted = 0`,
        [verse.verse_id]
      );

      // 하이라이트 색상 조회
      const highlightResult = await userDb.getFirstAsync<{ color: string }>(
        `SELECT color FROM highlights WHERE verse_id = ?`,
        [verse.verse_id]
      );

      return {
        ...verse,
        memo_count: memoResult?.count ?? 0,
        highlight_color: highlightResult?.color ?? null,
      };
    })
  );

  return versesWithMeta;
}

/**
 * 특정 구절 조회
 */
export async function getVerse(
  bibleId: string,
  bookId: number,
  chapter: number,
  verseNum: number
): Promise<Verse | null> {
  if (isWeb) {
    return MOCK_VERSES.find(
      v => v.bible_id === bibleId && v.book_id === bookId &&
           v.chapter === chapter && v.verse_num === verseNum
    ) ?? null;
  }
  const db = databaseService.getBibleDb();
  return await db.getFirstAsync<Verse>(
    `SELECT * FROM verses
     WHERE bible_id = ? AND book_id = ? AND chapter = ? AND verse_num = ?`,
    [bibleId, bookId, chapter, verseNum]
  );
}

/**
 * 구절 ID로 조회
 */
export async function getVerseById(verseId: number): Promise<Verse | null> {
  if (isWeb) {
    return MOCK_VERSES.find(v => v.verse_id === verseId) ?? null;
  }
  const db = databaseService.getBibleDb();
  return await db.getFirstAsync<Verse>(
    'SELECT * FROM verses WHERE verse_id = ?',
    [verseId]
  );
}

/**
 * 성경 전문 검색 (FTS5) - 책 이름 검색 지원
 * @param limit - 제한 없음 (전체 결과 표시)
 * @param offset - 페이지네이션용 오프셋
 */
export async function searchVerses(
  bibleId: string,
  query: string,
  langId: string,
  limit: number = 50000,
  offset: number = 0
): Promise<SearchResult[]> {
  if (isWeb) {
    return searchVersesSimple(bibleId, query, langId, limit, offset);
  }
  const db = databaseService.getBibleDb();

  // 1순위: 구절 참조 검색 시도 (예: "마가복음 1장 1절", "막 1:1")
  const refResults = await searchByVerseReference(bibleId, query, langId);
  if (refResults.length > 0) {
    return refResults;
  }

  // 2순위: 책 이름으로 검색 시도
  const bookResults = await searchByBookName(bibleId, query, langId, limit);
  if (bookResults.length > 0) {
    return bookResults;
  }

  // 3순위: FTS5 전문 검색
  return await db.getAllAsync<SearchResult>(
    `SELECT v.verse_id, v.bible_id, v.book_id, v.chapter, v.verse_num, v.text,
            bn.book_name
     FROM verses v
     JOIN verses_fts fts ON v.verse_id = fts.rowid
     JOIN book_names bn ON v.book_id = bn.book_id AND bn.lang_id = ?
     WHERE v.bible_id = ? AND verses_fts MATCH ?
     ORDER BY rank
     LIMIT ? OFFSET ?`,
    [langId, bibleId, query, limit, offset]
  );
}

/**
 * 단순 텍스트 검색 (LIKE) - 책 이름 검색 지원
 * @param limit - 제한 없음 (전체 결과 표시)
 * @param offset - 페이지네이션용 오프셋
 */
export async function searchVersesSimple(
  bibleId: string,
  query: string,
  langId: string,
  limit: number = 50000,
  offset: number = 0
): Promise<SearchResult[]> {
  if (isWeb) {
    // 웹 목업: 구절 참조 검색 시도
    const refResults = await searchByVerseReference(bibleId, query, langId);
    if (refResults.length > 0) {
      return refResults;
    }

    // 웹 목업: 책 이름 검색 시도
    const matchingBook = MOCK_BOOK_NAMES.find(
      b => b.book_name.includes(query) || (b.abbrev && b.abbrev.includes(query))
    );
    if (matchingBook) {
      const bookVerses = MOCK_VERSES
        .filter(v => v.bible_id === bibleId && v.book_id === matchingBook.book_id)
        .slice(offset, offset + limit);
      return bookVerses.map(v => ({ ...v, book_name: matchingBook.book_name }));
    }

    const results = MOCK_VERSES
      .filter(v => v.bible_id === bibleId && v.text.includes(query))
      .slice(offset, offset + limit);
    return results.map(v => {
      const bookName = MOCK_BOOK_NAMES.find(b => b.book_id === v.book_id)?.book_name ?? '';
      return { ...v, book_name: bookName };
    });
  }
  const db = databaseService.getBibleDb();

  // 1순위: 구절 참조 검색 시도 (예: "마가복음 1장 1절", "막 1:1")
  const refResults = await searchByVerseReference(bibleId, query, langId);
  if (refResults.length > 0) {
    return refResults;
  }

  // 2순위: 책 이름으로 검색 시도
  const bookResults = await searchByBookName(bibleId, query, langId, limit);
  if (bookResults.length > 0) {
    return bookResults;
  }

  // 3순위: LIKE 텍스트 검색
  return await db.getAllAsync<SearchResult>(
    `SELECT v.verse_id, v.bible_id, v.book_id, v.chapter, v.verse_num, v.text,
            bn.book_name
     FROM verses v
     JOIN book_names bn ON v.book_id = bn.book_id AND bn.lang_id = ?
     WHERE v.bible_id = ? AND v.text LIKE ?
     ORDER BY v.book_id, v.chapter, v.verse_num
     LIMIT ? OFFSET ?`,
    [langId, bibleId, `%${query}%`, limit, offset]
  );
}

/**
 * 구절 참조 파싱 결과 타입
 */
interface VerseReference {
  bookName: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
}

/**
 * 구절 참조 문자열 파싱
 * 지원 형식:
 * - "마가복음 1장 1절", "마가복음 1:1", "막 1:1"
 * - "마가복음 1장" (장 전체)
 * - "마가복음 1장 1-5절", "마가복음 1:1-5" (범위)
 * - "창 1:1", "창세기 1장 1절"
 */
function parseVerseReference(query: string): VerseReference | null {
  // 공백 정규화
  const normalized = query.trim().replace(/\s+/g, ' ');

  // 패턴 1: "책이름 장:절" 또는 "책이름 장:절-절"
  const colonPattern = /^(.+?)\s*(\d+)\s*:\s*(\d+)(?:\s*[-~]\s*(\d+))?$/;
  const colonMatch = normalized.match(colonPattern);
  if (colonMatch) {
    return {
      bookName: colonMatch[1].trim(),
      chapter: parseInt(colonMatch[2], 10),
      verseStart: parseInt(colonMatch[3], 10),
      verseEnd: colonMatch[4] ? parseInt(colonMatch[4], 10) : parseInt(colonMatch[3], 10),
    };
  }

  // 패턴 2: "책이름 장장 절절" (예: "마가복음 1장 1절", "창세기 1장 1-5절")
  const koreanPattern = /^(.+?)\s*(\d+)\s*장\s*(?:(\d+)(?:\s*[-~]\s*(\d+))?\s*절?)?$/;
  const koreanMatch = normalized.match(koreanPattern);
  if (koreanMatch) {
    return {
      bookName: koreanMatch[1].trim(),
      chapter: parseInt(koreanMatch[2], 10),
      verseStart: koreanMatch[3] ? parseInt(koreanMatch[3], 10) : undefined,
      verseEnd: koreanMatch[4] ? parseInt(koreanMatch[4], 10) : (koreanMatch[3] ? parseInt(koreanMatch[3], 10) : undefined),
    };
  }

  // 패턴 3: "책이름 장" (장 번호만, 예: "마가복음 1", "창 3")
  const chapterOnlyPattern = /^(.+?)\s+(\d+)$/;
  const chapterOnlyMatch = normalized.match(chapterOnlyPattern);
  if (chapterOnlyMatch) {
    return {
      bookName: chapterOnlyMatch[1].trim(),
      chapter: parseInt(chapterOnlyMatch[2], 10),
    };
  }

  return null;
}

/**
 * 구절 참조로 검색
 * "마가복음 1장 1절", "막 1:1" 등의 형식 지원
 */
export async function searchByVerseReference(
  bibleId: string,
  query: string,
  langId: string
): Promise<SearchResult[]> {
  const ref = parseVerseReference(query);
  if (!ref) {
    return [];
  }

  if (isWeb) {
    // 웹 목업
    const matchingBook = MOCK_BOOK_NAMES.find(
      b => b.book_name.includes(ref.bookName) || (b.abbrev && b.abbrev.includes(ref.bookName))
    );
    if (!matchingBook) return [];

    let verses = MOCK_VERSES.filter(
      v => v.bible_id === bibleId && v.book_id === matchingBook.book_id
    );

    if (ref.chapter) {
      verses = verses.filter(v => v.chapter === ref.chapter);
    }
    if (ref.verseStart !== undefined && ref.verseEnd !== undefined) {
      verses = verses.filter(v => v.verse_num >= ref.verseStart! && v.verse_num <= ref.verseEnd!);
    }

    return verses.map(v => ({ ...v, book_name: matchingBook.book_name }));
  }

  const db = databaseService.getBibleDb();

  // 책 이름 또는 약어로 매칭되는 책 찾기
  const matchingBook = await db.getFirstAsync<{ book_id: number; book_name: string }>(
    `SELECT book_id, book_name FROM book_names
     WHERE lang_id = ? AND (book_name LIKE ? OR abbrev LIKE ? OR book_name = ? OR abbrev = ?)
     ORDER BY
       CASE
         WHEN book_name = ? OR abbrev = ? THEN 0
         WHEN book_name LIKE ? OR abbrev LIKE ? THEN 1
         ELSE 2
       END,
       book_id
     LIMIT 1`,
    [langId, `${ref.bookName}%`, `${ref.bookName}%`, ref.bookName, ref.bookName,
     ref.bookName, ref.bookName, `${ref.bookName}%`, `${ref.bookName}%`]
  );

  if (!matchingBook) {
    return [];
  }

  // 장과 절에 따라 쿼리 구성
  if (ref.chapter && ref.verseStart !== undefined && ref.verseEnd !== undefined) {
    // 특정 절 또는 절 범위
    return await db.getAllAsync<SearchResult>(
      `SELECT v.verse_id, v.bible_id, v.book_id, v.chapter, v.verse_num, v.text,
              bn.book_name
       FROM verses v
       JOIN book_names bn ON v.book_id = bn.book_id AND bn.lang_id = ?
       WHERE v.bible_id = ? AND v.book_id = ? AND v.chapter = ?
         AND v.verse_num >= ? AND v.verse_num <= ?
       ORDER BY v.verse_num`,
      [langId, bibleId, matchingBook.book_id, ref.chapter, ref.verseStart, ref.verseEnd]
    );
  } else if (ref.chapter) {
    // 장 전체
    return await db.getAllAsync<SearchResult>(
      `SELECT v.verse_id, v.bible_id, v.book_id, v.chapter, v.verse_num, v.text,
              bn.book_name
       FROM verses v
       JOIN book_names bn ON v.book_id = bn.book_id AND bn.lang_id = ?
       WHERE v.bible_id = ? AND v.book_id = ? AND v.chapter = ?
       ORDER BY v.verse_num`,
      [langId, bibleId, matchingBook.book_id, ref.chapter]
    );
  }

  return [];
}

/**
 * BUG-002 수정: 책 이름으로 검색
 * 검색어가 책 이름과 매칭되면 해당 책의 전체 구절들 반환
 */
export async function searchByBookName(
  bibleId: string,
  query: string,
  langId: string,
  limit: number = 50000
): Promise<SearchResult[]> {
  if (isWeb) {
    const matchingBook = MOCK_BOOK_NAMES.find(
      b => b.book_name.includes(query) || (b.abbrev && b.abbrev.includes(query))
    );
    if (!matchingBook) return [];
    const bookVerses = MOCK_VERSES
      .filter(v => v.bible_id === bibleId && v.book_id === matchingBook.book_id)
      .slice(0, limit);
    return bookVerses.map(v => ({ ...v, book_name: matchingBook.book_name }));
  }

  const db = databaseService.getBibleDb();

  // 책 이름 또는 약어로 매칭되는 책 찾기
  const matchingBook = await db.getFirstAsync<{ book_id: number; book_name: string }>(
    `SELECT book_id, book_name FROM book_names
     WHERE lang_id = ? AND (book_name LIKE ? OR abbrev LIKE ?)
     ORDER BY book_id
     LIMIT 1`,
    [langId, `%${query}%`, `%${query}%`]
  );

  if (!matchingBook) {
    return [];
  }

  // 해당 책의 구절들 반환 (1장부터)
  return await db.getAllAsync<SearchResult>(
    `SELECT v.verse_id, v.bible_id, v.book_id, v.chapter, v.verse_num, v.text,
            bn.book_name
     FROM verses v
     JOIN book_names bn ON v.book_id = bn.book_id AND bn.lang_id = ?
     WHERE v.bible_id = ? AND v.book_id = ?
     ORDER BY v.chapter, v.verse_num
     LIMIT ?`,
    [langId, bibleId, matchingBook.book_id, limit]
  );
}

/**
 * 책의 총 장 수 조회
 */
export async function getBookChapterCount(bookId: number): Promise<number> {
  if (isWeb) {
    const book = MOCK_BOOKS.find(b => b.book_id === bookId);
    return book?.total_chapters ?? 0;
  }
  const db = databaseService.getBibleDb();
  const result = await db.getFirstAsync<{ total_chapters: number }>(
    'SELECT total_chapters FROM books WHERE book_id = ?',
    [bookId]
  );
  return result?.total_chapters ?? 0;
}

/**
 * 특정 장의 총 절 수 조회
 */
export async function getChapterVerseCount(
  bibleId: string,
  bookId: number,
  chapter: number
): Promise<number> {
  if (isWeb) {
    return MOCK_VERSES.filter(
      v => v.bible_id === bibleId && v.book_id === bookId && v.chapter === chapter
    ).length;
  }
  const db = databaseService.getBibleDb();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM verses
     WHERE bible_id = ? AND book_id = ? AND chapter = ?`,
    [bibleId, bookId, chapter]
  );
  return result?.count ?? 0;
}
