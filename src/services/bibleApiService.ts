// src/services/bibleApiService.ts
// 성경 API 통신 서비스

import { Platform } from 'react-native';
import type { BibleVersionInfo } from '../types/database';
import availableVersions from '../data/versions/available.json';

// API 기본 URL
const API_BASE_URL = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';

// 책 ID 매핑 (wldeh/bible-api 형식)
const BOOK_NAMES: Record<number, string> = {
  1: 'genesis', 2: 'exodus', 3: 'leviticus', 4: 'numbers', 5: 'deuteronomy',
  6: 'joshua', 7: 'judges', 8: 'ruth', 9: '1samuel', 10: '2samuel',
  11: '1kings', 12: '2kings', 13: '1chronicles', 14: '2chronicles',
  15: 'ezra', 16: 'nehemiah', 17: 'esther', 18: 'job', 19: 'psalms',
  20: 'proverbs', 21: 'ecclesiastes', 22: 'songofsolomon', 23: 'isaiah',
  24: 'jeremiah', 25: 'lamentations', 26: 'ezekiel', 27: 'daniel',
  28: 'hosea', 29: 'joel', 30: 'amos', 31: 'obadiah', 32: 'jonah',
  33: 'micah', 34: 'nahum', 35: 'habakkuk', 36: 'zephaniah', 37: 'haggai',
  38: 'zechariah', 39: 'malachi',
  40: 'matthew', 41: 'mark', 42: 'luke', 43: 'john', 44: 'acts',
  45: 'romans', 46: '1corinthians', 47: '2corinthians', 48: 'galatians',
  49: 'ephesians', 50: 'philippians', 51: 'colossians', 52: '1thessalonians',
  53: '2thessalonians', 54: '1timothy', 55: '2timothy', 56: 'titus',
  57: 'philemon', 58: 'hebrews', 59: 'james', 60: '1peter', 61: '2peter',
  62: '1john', 63: '2john', 64: '3john', 65: 'jude', 66: 'revelation',
};

// API 버전 ID 매핑
const VERSION_API_MAP: Record<string, string> = {
  KJV: 'en-kjv',
  ASV: 'en-asv',
  WEB: 'en-web',
  BSB: 'en-bsb',
  LSV: 'en-lsv',
  DRA: 'en-dra',
  GNV: 'en-gnv',
  RV09: 'es-rv09',
  LUTH: 'de-luther1912',
  CUV: 'cmn-Hans-CN-feb',
};

interface ChapterData {
  bookId: number;
  chapter: number;
  verses: Array<{
    verse: number;
    text: string;
  }>;
}

interface BookData {
  bookId: number;
  bookName: string;
  chapters: ChapterData[];
}

class BibleApiService {
  /**
   * 사용 가능한 모든 버전 목록 반환
   */
  getAvailableVersions(): BibleVersionInfo[] {
    return availableVersions.versions.map((v) => ({
      id: v.id,
      name: v.name,
      nameLocal: v.nameLocal,
      language: v.language,
      languageName: v.languageName,
      copyright: v.copyright,
      description: v.description || '',
      size: v.size,
      verseCount: v.verseCount,
      isDownloaded: false, // 실제 상태는 downloadStore에서 관리
      isBundled: v.isBundled,
      apiEndpoint: v.apiEndpoint || undefined,
    }));
  }

  /**
   * 언어별 버전 목록 반환
   */
  getVersionsByLanguage(langId: string): BibleVersionInfo[] {
    return this.getAvailableVersions().filter((v) => v.language === langId);
  }

  /**
   * 지원 언어 목록 반환
   */
  getLanguages(): Array<{ id: string; name: string; nameEnglish: string }> {
    return availableVersions.languages;
  }

  /**
   * 특정 버전의 전체 성경 다운로드
   */
  async downloadFullBible(
    versionId: string,
    onProgress?: (progress: number, bookId: number) => void
  ): Promise<BookData[]> {
    const apiVersionId = VERSION_API_MAP[versionId];
    if (!apiVersionId) {
      throw new Error(`Unsupported version: ${versionId}`);
    }

    const allBooks: BookData[] = [];
    const totalBooks = 66;

    for (let bookId = 1; bookId <= totalBooks; bookId++) {
      try {
        const bookData = await this.downloadBook(versionId, bookId);
        allBooks.push(bookData);

        if (onProgress) {
          onProgress(Math.round((bookId / totalBooks) * 100), bookId);
        }
      } catch (error) {
        console.error(`Failed to download book ${bookId}:`, error);
        throw error;
      }
    }

    return allBooks;
  }

  /**
   * 특정 책 다운로드
   */
  async downloadBook(versionId: string, bookId: number): Promise<BookData> {
    const apiVersionId = VERSION_API_MAP[versionId];
    const bookName = BOOK_NAMES[bookId];

    if (!apiVersionId || !bookName) {
      throw new Error(`Invalid version or book: ${versionId}, ${bookId}`);
    }

    const url = `${API_BASE_URL}/${apiVersionId}/books/${bookName}.json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformBookData(bookId, bookName, data);
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  /**
   * 특정 장 다운로드 (온라인 모드용)
   */
  async downloadChapter(
    versionId: string,
    bookId: number,
    chapter: number
  ): Promise<ChapterData> {
    const apiVersionId = VERSION_API_MAP[versionId];
    const bookName = BOOK_NAMES[bookId];

    if (!apiVersionId || !bookName) {
      throw new Error(`Invalid version or book: ${versionId}, ${bookId}`);
    }

    const url = `${API_BASE_URL}/${apiVersionId}/books/${bookName}/chapters/${chapter}.json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformChapterData(bookId, chapter, data);
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  /**
   * API 응답을 내부 형식으로 변환 (책)
   * wldeh/bible-api 형식: { data: [{ book, chapter, verse, text }, ...] }
   */
  private transformBookData(bookId: number, bookName: string, apiData: any): BookData {
    const chapters: ChapterData[] = [];
    const chapterMap: Map<number, Array<{ verse: number; text: string }>> = new Map();

    // data 배열에서 장별로 그룹화
    const dataArray = apiData.data || apiData || [];
    for (const item of dataArray) {
      const chapterNum = parseInt(item.chapter, 10);
      const verseNum = parseInt(item.verse, 10);

      if (!chapterMap.has(chapterNum)) {
        chapterMap.set(chapterNum, []);
      }

      chapterMap.get(chapterNum)!.push({
        verse: verseNum,
        text: item.text,
      });
    }

    // Map을 ChapterData 배열로 변환
    const sortedChapters = Array.from(chapterMap.keys()).sort((a, b) => a - b);
    for (const chapterNum of sortedChapters) {
      const verses = chapterMap.get(chapterNum)!;
      // 절 번호로 정렬하고 중복 제거
      const uniqueVerses = verses
        .sort((a, b) => a.verse - b.verse)
        .filter((v, i, arr) => i === 0 || v.verse !== arr[i - 1].verse);

      chapters.push({
        bookId,
        chapter: chapterNum,
        verses: uniqueVerses,
      });
    }

    return {
      bookId,
      bookName: dataArray[0]?.book || bookName,
      chapters,
    };
  }

  /**
   * API 응답을 내부 형식으로 변환 (장)
   * wldeh/bible-api 형식: { data: [{ book, chapter, verse, text }, ...] }
   */
  private transformChapterData(
    bookId: number,
    chapter: number,
    apiData: any
  ): ChapterData {
    const dataArray = apiData.data || apiData || [];
    const verses = dataArray
      .map((item: any) => ({
        verse: parseInt(item.verse, 10),
        text: item.text,
      }))
      .sort((a: any, b: any) => a.verse - b.verse)
      .filter((v: any, i: number, arr: any[]) => i === 0 || v.verse !== arr[i - 1].verse);

    return {
      bookId,
      chapter,
      verses,
    };
  }

  /**
   * 네트워크 연결 확인
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/en-kjv/books/genesis/chapters/1.json`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const bibleApiService = new BibleApiService();
