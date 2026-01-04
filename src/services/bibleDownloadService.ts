// src/services/bibleDownloadService.ts
// 성경 버전 다운로드 및 캐시 관리 서비스

import { Platform } from 'react-native';
import { bibleApiService } from './bibleApiService';
import { databaseService } from './database';
import type { DownloadProgress, DownloadStatus, BibleVersionInfo } from '../types/database';
import availableVersions from '../data/versions/available.json';

// 책 이름 매핑 (한글, 영어, 일본어)
const BOOK_NAMES_BY_LANG: Record<string, Record<number, string>> = {
  ko: {
    1: '창세기', 2: '출애굽기', 3: '레위기', 4: '민수기', 5: '신명기',
    6: '여호수아', 7: '사사기', 8: '룻기', 9: '사무엘상', 10: '사무엘하',
    11: '열왕기상', 12: '열왕기하', 13: '역대상', 14: '역대하',
    15: '에스라', 16: '느헤미야', 17: '에스더', 18: '욥기', 19: '시편',
    20: '잠언', 21: '전도서', 22: '아가', 23: '이사야', 24: '예레미야',
    25: '예레미야애가', 26: '에스겔', 27: '다니엘', 28: '호세아', 29: '요엘',
    30: '아모스', 31: '오바댜', 32: '요나', 33: '미가', 34: '나훔',
    35: '하박국', 36: '스바냐', 37: '학개', 38: '스가랴', 39: '말라기',
    40: '마태복음', 41: '마가복음', 42: '누가복음', 43: '요한복음', 44: '사도행전',
    45: '로마서', 46: '고린도전서', 47: '고린도후서', 48: '갈라디아서',
    49: '에베소서', 50: '빌립보서', 51: '골로새서', 52: '데살로니가전서',
    53: '데살로니가후서', 54: '디모데전서', 55: '디모데후서', 56: '디도서',
    57: '빌레몬서', 58: '히브리서', 59: '야고보서', 60: '베드로전서',
    61: '베드로후서', 62: '요한일서', 63: '요한이서', 64: '요한삼서',
    65: '유다서', 66: '요한계시록',
  },
  en: {
    1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
    6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
    11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
    15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
    20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
    24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
    28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
    33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
    38: 'Zechariah', 39: 'Malachi',
    40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
    45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians',
    49: 'Ephesians', 50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians',
    53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy', 56: 'Titus',
    57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter', 61: '2 Peter',
    62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation',
  },
  ja: {
    1: '創世記', 2: '出エジプト記', 3: 'レビ記', 4: '民数記', 5: '申命記',
    6: 'ヨシュア記', 7: '士師記', 8: 'ルツ記', 9: 'サムエル記上', 10: 'サムエル記下',
    11: '列王記上', 12: '列王記下', 13: '歴代志上', 14: '歴代志下',
    15: 'エズラ記', 16: 'ネヘミヤ記', 17: 'エステル記', 18: 'ヨブ記', 19: '詩篇',
    20: '箴言', 21: '伝道の書', 22: '雅歌', 23: 'イザヤ書', 24: 'エレミヤ書',
    25: '哀歌', 26: 'エゼキエル書', 27: 'ダニエル書', 28: 'ホセア書', 29: 'ヨエル書',
    30: 'アモス書', 31: 'オバデヤ書', 32: 'ヨナ書', 33: 'ミカ書', 34: 'ナホム書',
    35: 'ハバクク書', 36: 'ゼパニヤ書', 37: 'ハガイ書', 38: 'ゼカリヤ書', 39: 'マラキ書',
    40: 'マタイによる福音書', 41: 'マルコによる福音書', 42: 'ルカによる福音書',
    43: 'ヨハネによる福音書', 44: '使徒行伝', 45: 'ローマ人への手紙',
    46: 'コリント人への第一の手紙', 47: 'コリント人への第二の手紙',
    48: 'ガラテヤ人への手紙', 49: 'エペソ人への手紙', 50: 'ピリピ人への手紙',
    51: 'コロサイ人への手紙', 52: 'テサロニケ人への第一の手紙',
    53: 'テサロニケ人への第二の手紙', 54: 'テモテへの第一の手紙',
    55: 'テモテへの第二の手紙', 56: 'テトスへの手紙', 57: 'ピレモンへの手紙',
    58: 'ヘブル人への手紙', 59: 'ヤコブの手紙', 60: 'ペテロの第一の手紙',
    61: 'ペテロの第二の手紙', 62: 'ヨハネの第一の手紙', 63: 'ヨハネの第二の手紙',
    64: 'ヨハネの第三の手紙', 65: 'ユダの手紙', 66: 'ヨハネの黙示録',
  },
};

// 다운로드 취소 플래그
const cancelFlags: Map<string, boolean> = new Map();

class BibleDownloadService {
  /**
   * 성경 버전 다운로드 및 DB 저장
   */
  async downloadVersion(
    versionId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const versionInfo = availableVersions.versions.find((v) => v.id === versionId);
    if (!versionInfo) {
      throw new Error(`Unknown version: ${versionId}`);
    }

    if (versionInfo.isBundled) {
      throw new Error('Bundled versions cannot be downloaded');
    }

    // 취소 플래그 초기화
    cancelFlags.set(versionId, false);

    const progress: DownloadProgress = {
      versionId,
      progress: 0,
      downloadedBytes: 0,
      totalBytes: versionInfo.size,
      status: 'downloading',
    };

    try {
      // 다운로드 시작 콜백
      if (onProgress) onProgress(progress);

      // API에서 전체 성경 다운로드
      const booksData = await bibleApiService.downloadFullBible(
        versionId,
        (percent, bookId) => {
          // 취소 확인
          if (cancelFlags.get(versionId)) {
            throw new Error('Download cancelled');
          }

          progress.progress = Math.round(percent * 0.7); // 다운로드 70%
          progress.downloadedBytes = Math.round((percent / 100) * versionInfo.size);
          if (onProgress) onProgress(progress);
        }
      );

      // DB 삽입 시작
      progress.status = 'processing';
      progress.progress = 70;
      if (onProgress) onProgress(progress);

      // 데이터베이스에 저장
      await this.insertVersionToDb(versionId, versionInfo.language, booksData, (percent) => {
        progress.progress = 70 + Math.round(percent * 0.3); // DB 삽입 30%
        if (onProgress) onProgress(progress);
      });

      // 완료
      progress.status = 'completed';
      progress.progress = 100;
      if (onProgress) onProgress(progress);

      return true;
    } catch (error: any) {
      if (error.message === 'Download cancelled') {
        progress.status = 'cancelled';
      } else {
        progress.status = 'error';
        progress.error = error.message || 'Download failed';
      }
      if (onProgress) onProgress(progress);
      throw error;
    } finally {
      cancelFlags.delete(versionId);
    }
  }

  /**
   * 다운로드 취소
   */
  cancelDownload(versionId: string): void {
    cancelFlags.set(versionId, true);
  }

  /**
   * DB에 버전 데이터 삽입
   */
  private async insertVersionToDb(
    versionId: string,
    langId: string,
    booksData: any[],
    onProgress?: (percent: number) => void
  ): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('[BibleDownloadService] 웹 환경 - 목업 모드');
      return;
    }

    const bibleDb = databaseService.getBibleDb();
    const userDb = databaseService.getUserDb();
    if (!bibleDb || !userDb) {
      throw new Error('Database not initialized');
    }

    // 버전 정보 등록
    const versionInfo = availableVersions.versions.find((v) => v.id === versionId);
    await bibleDb.execAsync(`
      INSERT OR IGNORE INTO languages VALUES ('${langId}', '${this.getLangName(langId)}', 1);
      INSERT OR REPLACE INTO bibles VALUES ('${versionId}', '${langId}', '${versionInfo?.name}', '${versionInfo?.nameLocal}', '${versionInfo?.copyright}');
    `);

    // 책 이름 등록
    const bookNames = BOOK_NAMES_BY_LANG[langId] || BOOK_NAMES_BY_LANG.en;
    for (let bookId = 1; bookId <= 66; bookId++) {
      const bookName = bookNames[bookId];
      await bibleDb.execAsync(`
        INSERT OR IGNORE INTO book_names VALUES (${bookId}, '${langId}', '${bookName}', '${bookName.substring(0, 3)}');
      `);
    }

    // 구절 삽입
    let totalVerses = 0;
    const allVerses: string[] = [];

    for (const book of booksData) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          const escapedText = verse.text.replace(/'/g, "''");
          allVerses.push(`('${versionId}', ${book.bookId}, ${chapter.chapter}, ${verse.verse}, '${escapedText}')`);
          totalVerses++;
        }
      }
    }

    // 배치 삽입
    const batchSize = 100;
    for (let i = 0; i < allVerses.length; i += batchSize) {
      const batch = allVerses.slice(i, i + batchSize);
      await bibleDb.execAsync(`
        INSERT OR REPLACE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ${batch.join(',')};
      `);
      if (onProgress) {
        onProgress(((i + batch.length) / allVerses.length) * 100);
      }
    }

    // 다운로드 기록 저장
    const now = new Date().toISOString();
    await userDb.execAsync(`
      INSERT OR REPLACE INTO downloaded_versions (bible_id, downloaded_at, file_size, verse_count, is_bundled, last_used_at)
      VALUES ('${versionId}', '${now}', ${versionInfo?.size || 0}, ${totalVerses}, 0, '${now}');
    `);

    console.log(`[BibleDownloadService] ${versionId} 저장 완료: ${totalVerses}절`);
  }

  /**
   * 버전 삭제
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    const versionInfo = availableVersions.versions.find((v) => v.id === versionId);
    if (versionInfo?.isBundled) {
      throw new Error('Cannot delete bundled version');
    }

    const bibleDb = databaseService.getBibleDb();
    const userDb = databaseService.getUserDb();
    if (!bibleDb || !userDb) {
      throw new Error('Database not initialized');
    }

    // 구절 삭제
    await bibleDb.execAsync(`DELETE FROM verses WHERE bible_id = '${versionId}';`);
    // 버전 정보 삭제
    await bibleDb.execAsync(`DELETE FROM bibles WHERE bible_id = '${versionId}';`);
    // 다운로드 기록 삭제
    await userDb.execAsync(`DELETE FROM downloaded_versions WHERE bible_id = '${versionId}';`);

    console.log(`[BibleDownloadService] ${versionId} 삭제 완료`);
    return true;
  }

  /**
   * 다운로드된 버전 목록 조회
   */
  async getDownloadedVersions(): Promise<string[]> {
    if (Platform.OS === 'web') return ['KRV'];

    const userDb = databaseService.getUserDb();
    if (!userDb) return ['KRV'];

    try {
      const result = await userDb.getAllAsync(`SELECT bible_id FROM downloaded_versions;`);
      return result.map((row: any) => row.bible_id);
    } catch (error) {
      console.error('[BibleDownloadService] Error getting downloaded versions:', error);
      return ['KRV'];
    }
  }

  /**
   * 버전이 다운로드되었는지 확인
   */
  async isVersionDownloaded(versionId: string): Promise<boolean> {
    const downloaded = await this.getDownloadedVersions();
    return downloaded.includes(versionId);
  }

  /**
   * 마지막 사용 시간 업데이트
   */
  async updateLastUsed(versionId: string): Promise<void> {
    if (Platform.OS === 'web') return;

    const userDb = databaseService.getUserDb();
    if (!userDb) return;

    const now = new Date().toISOString();
    await userDb.execAsync(`
      UPDATE downloaded_versions SET last_used_at = '${now}' WHERE bible_id = '${versionId}';
    `);
  }

  private getLangName(langId: string): string {
    const langMap: Record<string, string> = {
      ko: '한국어',
      en: 'English',
      ja: '日本語',
    };
    return langMap[langId] || langId;
  }
}

export const bibleDownloadService = new BibleDownloadService();
