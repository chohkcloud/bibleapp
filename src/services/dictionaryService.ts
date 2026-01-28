/**
 * Dictionary Service
 * Strong's 사전, 성경 사전, 단어-Strong 매핑 서비스
 */

import type {
  StrongEntry,
  DictEntry,
  UnifiedSearchResult,
} from '../types/dictionary';

// 데이터 로드 (lazy loading)
let hstrongData: StrongEntry[] | null = null;
let gstrongData: StrongEntry[] | null = null;
let bibleDicData: DictEntry[] | null = null;
let wordStrongData: { word: string; strongNums: string[] }[] | null = null;

// 인덱스
let hstrongIndex: Map<string, StrongEntry> | null = null;
let gstrongIndex: Map<string, StrongEntry> | null = null;
let dicTermIndex: Map<string, DictEntry> | null = null;
let wordStrongIndex: Map<string, string[]> | null = null;

/**
 * 히브리어 Strong's 데이터 로드
 */
async function loadHstrong(): Promise<StrongEntry[]> {
  if (hstrongData) return hstrongData;

  try {
    hstrongData = require('../data/versions/bundled/hstrong.json');
    console.log(`[DictionaryService] Loaded ${hstrongData?.length || 0} Hebrew Strong entries`);
    return hstrongData || [];
  } catch (error) {
    console.error('[DictionaryService] Failed to load hstrong.json:', error);
    return [];
  }
}

/**
 * 헬라어 Strong's 데이터 로드
 */
async function loadGstrong(): Promise<StrongEntry[]> {
  if (gstrongData) return gstrongData;

  try {
    gstrongData = require('../data/versions/bundled/gstrong.json');
    console.log(`[DictionaryService] Loaded ${gstrongData?.length || 0} Greek Strong entries`);
    return gstrongData || [];
  } catch (error) {
    console.error('[DictionaryService] Failed to load gstrong.json:', error);
    return [];
  }
}

/**
 * 성경 사전 데이터 로드
 */
async function loadBibleDic(): Promise<DictEntry[]> {
  if (bibleDicData) return bibleDicData;

  try {
    bibleDicData = require('../data/versions/bundled/bibleDic.json');
    console.log(`[DictionaryService] Loaded ${bibleDicData?.length || 0} Bible dictionary entries`);
    return bibleDicData || [];
  } catch (error) {
    console.error('[DictionaryService] Failed to load bibleDic.json:', error);
    return [];
  }
}

/**
 * 단어-Strong 매핑 데이터 로드
 */
async function loadWordStrong(): Promise<{ word: string; strongNums: string[] }[]> {
  if (wordStrongData) return wordStrongData;

  try {
    wordStrongData = require('../data/versions/bundled/wordStrong.json');
    console.log(`[DictionaryService] Loaded ${wordStrongData?.length || 0} word-Strong mappings`);
    return wordStrongData || [];
  } catch (error) {
    console.error('[DictionaryService] Failed to load wordStrong.json:', error);
    return [];
  }
}

/**
 * 히브리어 Strong's 인덱스 구축
 */
async function getHstrongIndex(): Promise<Map<string, StrongEntry>> {
  if (hstrongIndex) return hstrongIndex;

  const data = await loadHstrong();
  hstrongIndex = new Map(data.map(e => [e.num, e]));
  return hstrongIndex;
}

/**
 * 헬라어 Strong's 인덱스 구축
 */
async function getGstrongIndex(): Promise<Map<string, StrongEntry>> {
  if (gstrongIndex) return gstrongIndex;

  const data = await loadGstrong();
  gstrongIndex = new Map(data.map(e => [e.num, e]));
  return gstrongIndex;
}

/**
 * 성경 사전 인덱스 구축
 */
async function getDicTermIndex(): Promise<Map<string, DictEntry>> {
  if (dicTermIndex) return dicTermIndex;

  const data = await loadBibleDic();
  dicTermIndex = new Map(data.map(e => [e.term, e]));
  return dicTermIndex;
}

/**
 * 단어-Strong 인덱스 구축
 */
async function getWordStrongIndex(): Promise<Map<string, string[]>> {
  if (wordStrongIndex) return wordStrongIndex;

  const data = await loadWordStrong();
  wordStrongIndex = new Map(data.map(e => [e.word.toLowerCase(), e.strongNums]));
  return wordStrongIndex;
}

class DictionaryService {
  private initialized = false;

  /**
   * 서비스 초기화 (모든 데이터 사전 로드)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[DictionaryService] Initializing...');
    await Promise.all([
      loadHstrong(),
      loadGstrong(),
      loadBibleDic(),
      loadWordStrong(),
    ]);
    this.initialized = true;
    console.log('[DictionaryService] Initialized');
  }

  /**
   * 히브리어 Strong's 번호로 조회
   */
  async getStrongHebrew(num: string): Promise<StrongEntry | null> {
    const index = await getHstrongIndex();
    const key = num.toUpperCase().startsWith('H') ? num.toUpperCase() : `H${num}`;
    return index.get(key) || null;
  }

  /**
   * 헬라어 Strong's 번호로 조회
   */
  async getStrongGreek(num: string): Promise<StrongEntry | null> {
    const index = await getGstrongIndex();
    const key = num.toUpperCase().startsWith('G') ? num.toUpperCase() : `G${num}`;
    return index.get(key) || null;
  }

  /**
   * Strong's 번호로 조회 (자동 판별)
   */
  async getStrong(num: string): Promise<StrongEntry | null> {
    const upperNum = num.toUpperCase();
    if (upperNum.startsWith('H')) {
      return this.getStrongHebrew(upperNum);
    } else if (upperNum.startsWith('G')) {
      return this.getStrongGreek(upperNum);
    }
    // 번호만 주어진 경우 히브리어 먼저 시도
    const hebrew = await this.getStrongHebrew(num);
    if (hebrew) return hebrew;
    return this.getStrongGreek(num);
  }

  /**
   * Strong's 검색 (원어, 음역, 의미로 검색)
   */
  async searchStrong(query: string, lang?: 'H' | 'G'): Promise<StrongEntry[]> {
    const lowerQuery = query.toLowerCase();
    const results: StrongEntry[] = [];

    const searchInData = async (data: StrongEntry[]) => {
      for (const entry of data) {
        if (
          entry.num.toLowerCase().includes(lowerQuery) ||
          entry.original.toLowerCase().includes(lowerQuery) ||
          entry.transliteration.toLowerCase().includes(lowerQuery) ||
          entry.pronunciation.toLowerCase().includes(lowerQuery) ||
          entry.pronunciationKo.includes(query) ||
          entry.meaning.toLowerCase().includes(lowerQuery) ||
          entry.meaningKo.includes(query)
        ) {
          results.push(entry);
          if (results.length >= 50) break;
        }
      }
    };

    if (!lang || lang === 'H') {
      const hData = await loadHstrong();
      await searchInData(hData);
    }

    if ((!lang || lang === 'G') && results.length < 50) {
      const gData = await loadGstrong();
      await searchInData(gData);
    }

    return results.slice(0, 50);
  }

  /**
   * 성경 사전 표제어로 조회
   */
  async getDictEntry(term: string): Promise<DictEntry | null> {
    const index = await getDicTermIndex();
    return index.get(term) || null;
  }

  /**
   * 성경 사전 검색
   */
  async searchBibleDictionary(query: string): Promise<DictEntry[]> {
    const data = await loadBibleDic();
    const lowerQuery = query.toLowerCase();
    const results: DictEntry[] = [];

    for (const entry of data) {
      if (
        entry.term.includes(query) ||
        entry.termEn?.toLowerCase().includes(lowerQuery) ||
        entry.shortMeaning?.includes(query) ||
        entry.definition.includes(query)
      ) {
        results.push(entry);
        if (results.length >= 50) break;
      }
    }

    return results;
  }

  /**
   * 단어로 Strong 번호 조회
   */
  async getStrongByWord(word: string): Promise<string[]> {
    const index = await getWordStrongIndex();
    return index.get(word.toLowerCase()) || [];
  }

  /**
   * 통합 검색 (성경 구절 + 사전)
   */
  async unifiedSearch(query: string): Promise<UnifiedSearchResult> {
    const [dictionary, strongH, strongG] = await Promise.all([
      this.searchBibleDictionary(query),
      this.searchStrong(query, 'H'),
      this.searchStrong(query, 'G'),
    ]);

    return {
      verses: [], // 성경 검색은 bundledBibleService에서 처리
      dictionary,
      strongH,
      strongG,
    };
  }

  /**
   * 데이터 로드 상태 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 통계 정보
   */
  async getStats(): Promise<{
    hebrewStrong: number;
    greekStrong: number;
    bibleDic: number;
    wordStrong: number;
  }> {
    const [hData, gData, dicData, wsData] = await Promise.all([
      loadHstrong(),
      loadGstrong(),
      loadBibleDic(),
      loadWordStrong(),
    ]);

    return {
      hebrewStrong: hData.length,
      greekStrong: gData.length,
      bibleDic: dicData.length,
      wordStrong: wsData.length,
    };
  }
}

export const dictionaryService = new DictionaryService();
export default dictionaryService;
