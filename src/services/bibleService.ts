// src/services/bibleService.ts
// 성경 데이터 조회 및 검색 서비스

import {
  getLanguages,
  getAllBibles,
  getBiblesByLanguage,
  getBibleById,
  getBooks,
  getBooksByTestament,
  getBooksWithNames,
  getBookNames,
  getChapterVerses,
  getChapterVersesWithMeta,
  getVerse,
  getVerseById,
  searchVerses,
  searchVersesSimple,
  getBookChapterCount,
  getChapterVerseCount,
} from './database/bibleQueries';
import type {
  Language,
  Bible,
  Book,
  BookName,
  Verse,
  VerseWithMeta,
  SearchResult,
} from '../types/database';
import { AppError, ErrorCode } from '../utils/errorCodes';

class BibleService {
  /**
   * 지원 언어 목록 조회
   */
  async getLanguages(): Promise<Language[]> {
    try {
      return await getLanguages();
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '언어 목록 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 성경 버전 목록 조회
   * @param langId - 언어 ID (선택)
   */
  async getBibles(langId?: string): Promise<Bible[]> {
    try {
      if (langId) {
        return await getBiblesByLanguage(langId);
      }
      return await getAllBibles();
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '성경 버전 목록 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 특정 성경 버전 조회
   */
  async getBibleById(bibleId: string): Promise<Bible | null> {
    try {
      return await getBibleById(bibleId);
    } catch (error) {
      throw new AppError(
        ErrorCode.BIBLE_NOT_FOUND,
        '성경 버전을 찾을 수 없습니다.',
        error as Error
      );
    }
  }

  /**
   * 성경 책 목록 조회
   * @param langId - 언어 ID (책 이름 언어)
   */
  async getBooks(langId: string): Promise<(Book & { book_name: string; abbrev: string | null })[]> {
    try {
      return await getBooksWithNames(langId);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '책 목록 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 구약/신약별 책 목록 조회
   */
  async getBooksByTestament(testament: 'OT' | 'NT'): Promise<Book[]> {
    try {
      return await getBooksByTestament(testament);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '책 목록 조회에 실패했습니다.',
        error as Error
      );
    }
  }

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
  ): Promise<VerseWithMeta[]> {
    try {
      return await getChapterVersesWithMeta(bibleId, bookId, chapter);
    } catch (error) {
      throw new AppError(
        ErrorCode.BIBLE_VERSE_NOT_FOUND,
        '구절 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 특정 장의 구절 목록 조회 (메타 정보 없이)
   */
  async getChapterSimple(
    bibleId: string,
    bookId: number,
    chapter: number
  ): Promise<Verse[]> {
    try {
      return await getChapterVerses(bibleId, bookId, chapter);
    } catch (error) {
      throw new AppError(
        ErrorCode.BIBLE_VERSE_NOT_FOUND,
        '구절 조회에 실패했습니다.',
        error as Error
      );
    }
  }

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
  ): Promise<Verse | null> {
    try {
      return await getVerse(bibleId, bookId, chapter, verseNum);
    } catch (error) {
      throw new AppError(
        ErrorCode.BIBLE_VERSE_NOT_FOUND,
        '구절을 찾을 수 없습니다.',
        error as Error
      );
    }
  }

  /**
   * verse_id로 구절 조회
   */
  async getVerseById(verseId: number): Promise<Verse | null> {
    try {
      return await getVerseById(verseId);
    } catch (error) {
      throw new AppError(
        ErrorCode.BIBLE_VERSE_NOT_FOUND,
        '구절을 찾을 수 없습니다.',
        error as Error
      );
    }
  }

  /**
   * 성경 검색 (전문검색) - 책 이름 검색 지원
   * @param bibleId - 성경 버전 ID
   * @param query - 검색어
   * @param langId - 책 이름 표시 언어
   * @param limit - 결과 개수 제한 (기본 500, BUG-001 수정)
   * @param offset - 페이지네이션 오프셋 (기본 0)
   * @param bookId - 특정 책에서만 검색 (선택)
   */
  async search(
    bibleId: string,
    query: string,
    langId: string,
    limit: number = 500,
    offset: number = 0,
    bookId?: number
  ): Promise<SearchResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      // bookId가 있으면 단순 검색 사용 (FTS5는 bookId 필터 미지원)
      if (bookId) {
        return await searchVersesSimple(bibleId, query.trim(), langId, limit, offset, bookId);
      }

      // FTS5 검색 시도 (책 이름 검색 포함)
      try {
        return await searchVerses(bibleId, query.trim(), langId, limit, offset);
      } catch {
        // FTS5 실패 시 단순 LIKE 검색 시도
        return await searchVersesSimple(bibleId, query.trim(), langId, limit, offset);
      }
    } catch (error) {
      throw new AppError(
        ErrorCode.BIBLE_SEARCH_FAILED,
        '검색에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 단순 검색 (LIKE) - 책 이름 검색 지원
   * @param limit - 기본 500 (BUG-001 수정)
   * @param offset - 페이지네이션 오프셋
   * @param bookId - 특정 책에서만 검색 (선택)
   */
  async searchSimple(
    bibleId: string,
    query: string,
    langId: string,
    limit: number = 500,
    offset: number = 0,
    bookId?: number
  ): Promise<SearchResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }
      return await searchVersesSimple(bibleId, query.trim(), langId, limit, offset, bookId);
    } catch (error) {
      throw new AppError(
        ErrorCode.BIBLE_SEARCH_FAILED,
        '검색에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 책의 총 장 수 조회
   */
  async getTotalChapters(bookId: number): Promise<number> {
    try {
      return await getBookChapterCount(bookId);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '장 수 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 장의 총 절 수 조회
   */
  async getTotalVerses(
    bibleId: string,
    bookId: number,
    chapter: number
  ): Promise<number> {
    try {
      return await getChapterVerseCount(bibleId, bookId, chapter);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '절 수 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 구절 레퍼런스 문자열 생성
   * @example "요한복음 3:16"
   */
  async getVerseReference(
    bookId: number,
    chapter: number,
    verseNum: number,
    langId: string
  ): Promise<string> {
    try {
      const bookNames = await getBookNames(langId);
      const bookName = bookNames.find((b) => b.book_id === bookId);

      if (!bookName) {
        return `${bookId}장 ${chapter}:${verseNum}`;
      }

      return `${bookName.book_name} ${chapter}:${verseNum}`;
    } catch {
      return `${bookId}장 ${chapter}:${verseNum}`;
    }
  }

  /**
   * 이전 장 정보 조회
   */
  async getPreviousChapter(
    bookId: number,
    chapter: number
  ): Promise<{ bookId: number; chapter: number } | null> {
    if (chapter > 1) {
      return { bookId, chapter: chapter - 1 };
    }

    // 이전 책의 마지막 장
    if (bookId > 1) {
      const prevBookId = bookId - 1;
      const totalChapters = await this.getTotalChapters(prevBookId);
      if (totalChapters > 0) {
        return { bookId: prevBookId, chapter: totalChapters };
      }
    }

    return null;
  }

  /**
   * 다음 장 정보 조회
   */
  async getNextChapter(
    bookId: number,
    chapter: number
  ): Promise<{ bookId: number; chapter: number } | null> {
    const totalChapters = await this.getTotalChapters(bookId);

    if (chapter < totalChapters) {
      return { bookId, chapter: chapter + 1 };
    }

    // 다음 책의 첫 장
    if (bookId < 66) {
      return { bookId: bookId + 1, chapter: 1 };
    }

    return null;
  }
}

export const bibleService = new BibleService();
