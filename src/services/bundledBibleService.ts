// src/services/bundledBibleService.ts
// 동적 로딩 (메모리 최적화) - 정적 import 제거

interface BundledVerse { bookId: number; chapter: number; verse: number; text: string; }
interface BundledComment { bookId: number; chapter: number; verseStart: number; verseEnd: number; subject: string; note: string; }
interface ParallelVerse { versionId: string; versionName: string; language: string; text: string; }

type CommentaryType = 'MH' | 'TH'; // MH: 매튜헨리, TH: 토마호크

const COMMENTARY_INFO: Record<CommentaryType, { name: string; description: string }> = {
  MH: { name: '매튜헨리 주석', description: '매튜 헨리의 구약/신약 주석' },
  TH: { name: '토마호크 주석', description: '토마호크 성경 주석' },
};

const loadedBibles: Map<string, BundledVerse[]> = new Map();
const commentsCache: Map<CommentaryType, any[]> = new Map();
const SUPPORTED_VERSIONS = ['HCV', 'HKJ', 'HML', 'HRV', 'HSN', 'KJV', 'NIV', 'ASV', 'NAS', 'JPM'];

function loadBibleVersionSync(versionId: string): BundledVerse[] {
  if (loadedBibles.has(versionId)) return loadedBibles.get(versionId)!;
  console.log('[BundledBibleService] Loading ' + versionId);
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
    return data;
  } catch (e) { console.error(e); return []; }
}

function loadComments(type: CommentaryType): any[] {
  if (commentsCache.has(type)) return commentsCache.get(type)!;
  console.log('[BundledBibleService] Loading comments:', type);
  try {
    let data: any[];
    switch (type) {
      case 'MH': data = require('../data/versions/bundled/mh_comments.json'); break;
      case 'TH': data = require('../data/versions/bundled/th_comments.json'); break;
      default: return [];
    }
    commentsCache.set(type, data);
    return data;
  } catch (e) { console.error('[BundledBibleService] Failed to load comments:', type, e); return []; }
}

const VERSION_DISPLAY_NAMES: Record<string, { name: string; lang: string }> = {
  HCV: { name: '개역한글', lang: 'ko' }, HKJ: { name: '개역개정', lang: 'ko' }, HML: { name: '현대인의 성경', lang: 'ko' },
  HRV: { name: '공동번역', lang: 'ko' }, HSN: { name: '새번역', lang: 'ko' }, KJV: { name: 'KJV', lang: 'en' },
  NIV: { name: 'NIV', lang: 'en' }, ASV: { name: 'ASV', lang: 'en' }, NAS: { name: 'NASB', lang: 'en' }, JPM: { name: '日本語', lang: 'ja' },
};

type VerseIndex = Map<string, BundledVerse[]>;
const versionIndexCache: Map<string, VerseIndex> = new Map();

function buildIndex(versionId: string): VerseIndex {
  if (versionIndexCache.has(versionId)) return versionIndexCache.get(versionId)!;
  const data = loadBibleVersionSync(versionId);
  if (!data || data.length === 0) return new Map();
  const index: VerseIndex = new Map();
  for (const v of data) { const k = v.bookId + '-' + v.chapter; if (!index.has(k)) index.set(k, []); index.get(k)!.push(v); }
  versionIndexCache.set(versionId, index);
  return index;
}

class BundledBibleService {
  isBundled(versionId: string): boolean { return SUPPORTED_VERSIONS.includes(versionId.toUpperCase()); }
  getBundledVersions(): string[] { return [...SUPPORTED_VERSIONS]; }
  getChapterVerses(versionId: string, bookId: number, chapter: number): BundledVerse[] {
    return (buildIndex(versionId.toUpperCase()).get(bookId + '-' + chapter) || []).sort((a, b) => a.verse - b.verse);
  }
  getVerse(versionId: string, bookId: number, chapter: number, verseNum: number): BundledVerse | undefined {
    return this.getChapterVerses(versionId, bookId, chapter).find(v => v.verse === verseNum);
  }
  search(versionId: string, query: string, limit = 100, bookId?: number): BundledVerse[] {
    const data = loadBibleVersionSync(versionId.toUpperCase()); if (!data) return [];
    const q = query.toLowerCase(), r: BundledVerse[] = [];
    for (const v of data) { if (bookId && v.bookId !== bookId) continue; if (v.text.toLowerCase().includes(q)) { r.push(v); if (r.length >= limit) break; } }
    return r;
  }
  getChapterCount(versionId: string, bookId: number): number {
    let m = 0; for (const k of buildIndex(versionId.toUpperCase()).keys()) { const [b, c] = k.split('-').map(Number); if (b === bookId && c > m) m = c; } return m;
  }
  getVerseCount(versionId: string, bookId: number, chapter: number): number { return this.getChapterVerses(versionId, bookId, chapter).length; }

  // 주석 관련 메서드 (다중 주석 지원)
  getComments(bookId: number, chapter: number, type: CommentaryType = 'TH'): BundledComment[] {
    return loadComments(type).filter(c => c.bookId === bookId && c.chapter === chapter);
  }
  getVerseComments(bookId: number, chapter: number, verseNum: number, type: CommentaryType = 'TH'): BundledComment[] {
    return loadComments(type).filter(c => c.bookId === bookId && c.chapter === chapter && verseNum >= c.verseStart && verseNum <= c.verseEnd);
  }
  getCommentaryTypes(): { type: CommentaryType; name: string; description: string }[] {
    return Object.entries(COMMENTARY_INFO).map(([type, info]) => ({
      type: type as CommentaryType,
      ...info,
    }));
  }
  getCommentaryInfo(type: CommentaryType) { return COMMENTARY_INFO[type]; }

  getAllVerses(versionId: string): BundledVerse[] { return loadBibleVersionSync(versionId.toUpperCase()); }
  getParallelVerses(bookId: number, chapter: number, verseNum: number, versionIds: string[]): ParallelVerse[] {
    const r: ParallelVerse[] = [];
    for (const vid of versionIds) { const v = this.getVerse(vid.toUpperCase(), bookId, chapter, verseNum), d = VERSION_DISPLAY_NAMES[vid.toUpperCase()];
      if (v && d) r.push({ versionId: vid.toUpperCase(), versionName: d.name, language: d.lang, text: v.text }); }
    return r;
  }
  getParallelChapter(bookId: number, chapter: number, versionIds: string[]): Record<string, { versionName: string; language: string; verses: BundledVerse[] }> {
    const r: Record<string, { versionName: string; language: string; verses: BundledVerse[] }> = {};
    for (const vid of versionIds) { const verses = this.getChapterVerses(vid.toUpperCase(), bookId, chapter), d = VERSION_DISPLAY_NAMES[vid.toUpperCase()];
      if (d) r[vid.toUpperCase()] = { versionName: d.name, language: d.lang, verses }; }
    return r;
  }
  getVersionDisplayInfo(versionId: string) { return VERSION_DISPLAY_NAMES[versionId.toUpperCase()]; }
  getAllVersionDisplayInfo() { return { ...VERSION_DISPLAY_NAMES }; }
  unloadVersion(versionId: string): void { loadedBibles.delete(versionId.toUpperCase()); versionIndexCache.delete(versionId.toUpperCase()); }
  clearCache(): void { loadedBibles.clear(); versionIndexCache.clear(); commentsCache.clear(); }
}

export const bundledBibleService = new BundledBibleService();
export type { BundledVerse, BundledComment, ParallelVerse, CommentaryType };
