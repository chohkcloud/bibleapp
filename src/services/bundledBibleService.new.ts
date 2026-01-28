// src/services/bundledBibleService.ts
// 번들된 성경 데이터 로드 서비스 - 동적 로딩 (메모리 최적화)
// 정적 import 제거 - 필요시에만 동적으로 로드

// 타입 정의
interface BundledVerse {
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
}

interface BundledComment {
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  subject: string;
  note: string;
}

interface ParallelVerse {
  versionId: string;
  versionName: string;
  language: string;
  text: string;
}

// 동적 로딩 캐시
const loadedBibles: Map<string, BundledVerse[]> = new Map();
let commentsDataCache: any[] | null = null;

// 지원되는 버전 목록
const SUPPORTED_VERSIONS = ['HCV', 'HKJ', 'HML', 'HRV', 'HSN', 'KJV', 'NIV', 'ASV', 'NAS', 'JPM'];

// 동적 로딩 함수
function loadBibleVersionSync(versionId: string): BundledVerse[] {
  if (loadedBibles.has(versionId)) {
    return loadedBibles.get(versionId)!;
  }
  console.log('[BundledBibleService] Loading ' + versionId + '...');
  try {
    let data: BundledVerse[];
    switch (versionId) {
      case 'HCV': data = require('../data/versions/bundled/hcv.json'); break;
      case 'HKJ': data = require('../data/versions/bundled/hkj.json'); break;
      case 'HML': data = require('../data/versions/bundled/hml.json'); break;
      case 'HRV': data = require('../data/versions/bundled/hrv.json'); break;
      case 'HSN': data = require('../data/versions/bundled/hsn.json'); break;
      case 'KJV': data = require('../data/versions/bundled/kjv.json'); break;
      case 'NIV': data = require('../data/versions/bundled/niv.json'); break;
      case 'ASV': data = require('../data/versions/bundled/asv.json'); break;
      case 'NAS': data = require('../data/versions/bundled/nas.json'); break;
      case 'JPM': data = require('../data/versions/bundled/jpm.json'); break;
      default: return [];
    }
    loadedBibles.set(versionId, data);
    console.log('[BundledBibleService] Loaded ' + versionId);
    return data;
  } catch (error) {
    console.error('[BundledBibleService] Failed to load:', error);
    return [];
  }
}

function loadComments(): any[] {
  if (!commentsDataCache) {
    try {
      commentsDataCache = require('../data/versions/bundled/comments.json');
    } catch { commentsDataCache = []; }
  }
  return commentsDataCache || [];
}

const VERSION_DISPLAY_NAMES: Record<string, { name: string; lang: string }> = {
  HCV: { name: '개역한글', lang: 'ko' },
  HKJ: { name: '개역개정', lang: 'ko' },
  HML: { name: '현대인의 성경', lang: 'ko' },
  HRV: { name: '공동번역', lang: 'ko' },
  HSN: { name: '새번역', lang: 'ko' },
  KJV: { name: 'KJV', lang: 'en' },
  NIV: { name: 'NIV', lang: 'en' },
  ASV: { name: 'ASV', lang: 'en' },
  NAS: { name: 'NASB', lang: 'en' },
  JPM: { name: '日本語', lang: 'ja' },
};

type VerseIndex = Map<string, BundledVerse[]>;
const versionIndexCache: Map<string, VerseIndex> = new Map();

function buildIndex(versionId: string): VerseIndex {
  if (versionIndexCache.has(versionId)) return versionIndexCache.get(versionId)!;
  const data = loadBibleVersionSync(versionId);
  if (!data || data.length === 0) return new Map();
  const index: VerseIndex = new Map();
  for (const verse of data) {
    const key = verse.bookId + '-' + verse.chapter;
    if (!index.has(key)) index.set(key, []);
    index.get(key)!.push(verse);
  }
  versionIndexCache.set(versionId, index);
  return index;
}

class BundledBibleService {
  isBundled(versionId: string): boolean { return SUPPORTED_VERSIONS.includes(versionId.toUpperCase()); }
  getBundledVersions(): string[] { return [...SUPPORTED_VERSIONS]; }
  getChapterVerses(versionId: string, bookId: number, chapter: number): BundledVerse[] {
    const index = buildIndex(versionId.toUpperCase());
    return (index.get(bookId + '-' + chapter) || []).sort((a, b) => a.verse - b.verse);
  }
  getVerse(versionId: string, bookId: number, chapter: number, verseNum: number): BundledVerse | undefined {
    return this.getChapterVerses(versionId, bookId, chapter).find(v => v.verse === verseNum);
  }
  search(versionId: string, query: string, limit = 100, bookId?: number): BundledVerse[] {
    const data = loadBibleVersionSync(versionId.toUpperCase());
    if (!data) return [];
    const q = query.toLowerCase();
    const results: BundledVerse[] = [];
    for (const v of data) {
      if (bookId && v.bookId !== bookId) continue;
      if (v.text.toLowerCase().includes(q)) { results.push(v); if (results.length >= limit) break; }
    }
    return results;
  }
  getChapterCount(versionId: string, bookId: number): number {
    const index = buildIndex(versionId.toUpperCase());
    let max = 0;
    for (const key of index.keys()) {
      const [b, c] = key.split('-').map(Number);
      if (b === bookId && c > max) max = c;
    }
    return max;
  }
  getVerseCount(versionId: string, bookId: number, chapter: number): number {
    return this.getChapterVerses(versionId, bookId, chapter).length;
  }
  getComments(bookId: number, chapter: number): BundledComment[] {
    return loadComments().filter(c => c.bookId === bookId && c.chapter === chapter);
  }
  getVerseComments(bookId: number, chapter: number, verseNum: number): BundledComment[] {
    return loadComments().filter(c => c.bookId === bookId && c.chapter === chapter && verseNum >= c.verseStart && verseNum <= c.verseEnd);
  }
  getAllVerses(versionId: string): BundledVerse[] { return loadBibleVersionSync(versionId.toUpperCase()); }
  getParallelVerses(bookId: number, chapter: number, verseNum: number, versionIds: string[]): ParallelVerse[] {
    const results: ParallelVerse[] = [];
    for (const vid of versionIds) {
      const v = this.getVerse(vid.toUpperCase(), bookId, chapter, verseNum);
      const d = VERSION_DISPLAY_NAMES[vid.toUpperCase()];
      if (v && d) results.push({ versionId: vid.toUpperCase(), versionName: d.name, language: d.lang, text: v.text });
    }
    return results;
  }
  getParallelChapter(bookId: number, chapter: number, versionIds: string[]): Record<string, { versionName: string; language: string; verses: BundledVerse[] }> {
    const r: Record<string, { versionName: string; language: string; verses: BundledVerse[] }> = {};
    for (const vid of versionIds) {
      const verses = this.getChapterVerses(vid.toUpperCase(), bookId, chapter);
      const d = VERSION_DISPLAY_NAMES[vid.toUpperCase()];
      if (d) r[vid.toUpperCase()] = { versionName: d.name, language: d.lang, verses };
    }
    return r;
  }
  getVersionDisplayInfo(versionId: string) { return VERSION_DISPLAY_NAMES[versionId.toUpperCase()]; }
  getAllVersionDisplayInfo() { return { ...VERSION_DISPLAY_NAMES }; }
  unloadVersion(versionId: string): void { loadedBibles.delete(versionId.toUpperCase()); versionIndexCache.delete(versionId.toUpperCase()); }
  clearCache(): void { loadedBibles.clear(); versionIndexCache.clear(); commentsDataCache = null; }
}

export const bundledBibleService = new BundledBibleService();
export type { BundledVerse, BundledComment, ParallelVerse };

