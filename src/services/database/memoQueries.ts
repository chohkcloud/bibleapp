// src/services/database/memoQueries.ts
// 메모, 북마크, 하이라이트 관련 쿼리 함수

import { Platform } from 'react-native';
import { databaseService } from './index';
import type {
  Memo,
  MemoTag,
  Bookmark,
  Highlight,
  CreateMemoDto,
  UpdateMemoDto,
  CreateBookmarkDto,
  CreateHighlightDto,
  CreateTagDto,
  TopVerse,
  DailyStat,
  MonthlyStat,
} from '../../types/database';

const isWeb = Platform.OS === 'web';

// ============================================
// 웹용 인메모리 저장소
// ============================================
const webMemos: Memo[] = [];
const webTags: MemoTag[] = [];
const webBookmarks: Bookmark[] = [];
const webHighlights: Highlight[] = [];

// UUID 생성 함수
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 현재 시간 ISO 문자열
function getCurrentISOTime(): string {
  return new Date().toISOString();
}

// ============================================
// 메모 CRUD
// ============================================

/**
 * 메모 생성
 */
export async function createMemo(dto: CreateMemoDto): Promise<string> {
  const memoId = generateUUID();
  const now = getCurrentISOTime();

  if (isWeb) {
    const memo: Memo = {
      memo_id: memoId,
      id: memoId,  // memo_id 별칭
      verse_id: dto.verse_id,
      bible_id: dto.bible_id,
      book_id: dto.book_id,
      chapter: dto.chapter,
      verse_num: dto.verse_num,
      verse_start: dto.verse_start,
      verse_end: dto.verse_end,
      verse_range: dto.verse_range,
      content: dto.content,
      is_encrypted: 1,
      created_at: now,
      updated_at: now,
      is_deleted: 0,
    };
    webMemos.push(memo);
    return memoId;
  }

  const db = databaseService.getUserDb();

  await db.runAsync(
    `INSERT INTO memos (memo_id, verse_id, bible_id, book_id, chapter, verse_num,
                        verse_start, verse_end, verse_range,
                        content, is_encrypted, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [memoId, dto.verse_id, dto.bible_id, dto.book_id, dto.chapter, dto.verse_num,
     dto.verse_start ?? null, dto.verse_end ?? null, dto.verse_range ?? null,
     dto.content, now, now]
  );

  // 태그 연결
  if (dto.tags && dto.tags.length > 0) {
    for (const tagId of dto.tags) {
      await db.runAsync(
        'INSERT INTO memo_tag_map (memo_id, tag_id) VALUES (?, ?)',
        [memoId, tagId]
      );
    }
  }

  return memoId;
}

/**
 * 메모 수정
 */
export async function updateMemo(memoId: string, dto: UpdateMemoDto): Promise<void> {
  const now = getCurrentISOTime();

  if (isWeb) {
    const memo = webMemos.find(m => m.memo_id === memoId);
    if (memo && dto.content !== undefined) {
      memo.content = dto.content;
      memo.updated_at = now;
    }
    return;
  }

  const db = databaseService.getUserDb();

  if (dto.content !== undefined) {
    await db.runAsync(
      'UPDATE memos SET content = ?, updated_at = ? WHERE memo_id = ?',
      [dto.content, now, memoId]
    );
  }

  // 태그 업데이트
  if (dto.tags !== undefined) {
    // 기존 태그 삭제
    await db.runAsync('DELETE FROM memo_tag_map WHERE memo_id = ?', [memoId]);

    // 새 태그 연결
    for (const tagId of dto.tags) {
      await db.runAsync(
        'INSERT INTO memo_tag_map (memo_id, tag_id) VALUES (?, ?)',
        [memoId, tagId]
      );
    }
  }
}

/**
 * 메모 삭제 (Soft Delete)
 */
export async function deleteMemo(memoId: string): Promise<void> {
  if (isWeb) {
    const memo = webMemos.find(m => m.memo_id === memoId);
    if (memo) {
      memo.is_deleted = 1;
      memo.updated_at = getCurrentISOTime();
    }
    return;
  }

  const db = databaseService.getUserDb();
  const now = getCurrentISOTime();

  await db.runAsync(
    'UPDATE memos SET is_deleted = 1, updated_at = ? WHERE memo_id = ?',
    [now, memoId]
  );
}

/**
 * 메모 영구 삭제
 */
export async function permanentDeleteMemo(memoId: string): Promise<void> {
  if (isWeb) {
    const idx = webMemos.findIndex(m => m.memo_id === memoId);
    if (idx !== -1) webMemos.splice(idx, 1);
    return;
  }

  const db = databaseService.getUserDb();

  await db.runAsync('DELETE FROM memo_tag_map WHERE memo_id = ?', [memoId]);
  await db.runAsync('DELETE FROM memos WHERE memo_id = ?', [memoId]);
}

/**
 * 메모 ID로 조회
 */
export async function getMemoById(memoId: string): Promise<Memo | null> {
  if (isWeb) {
    return webMemos.find(m => m.memo_id === memoId && !m.is_deleted) ?? null;
  }

  const db = databaseService.getUserDb();
  return await db.getFirstAsync<Memo>(
    `SELECT m.*, GROUP_CONCAT(t.tag_name) as tags
     FROM memos m
     LEFT JOIN memo_tag_map mtm ON m.memo_id = mtm.memo_id
     LEFT JOIN memo_tags t ON mtm.tag_id = t.tag_id
     WHERE m.memo_id = ? AND m.is_deleted = 0
     GROUP BY m.memo_id`,
    [memoId]
  );
}

/**
 * 특정 구절의 메모 목록 조회
 */
export async function getMemosByVerse(
  bibleId: string,
  bookId: number,
  chapter: number,
  verseNum: number
): Promise<Memo[]> {
  if (isWeb) {
    return webMemos.filter(
      m => m.bible_id === bibleId && m.book_id === bookId &&
           m.chapter === chapter && m.verse_num === verseNum && !m.is_deleted
    );
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<Memo>(
    `SELECT m.*, GROUP_CONCAT(t.tag_name) as tags
     FROM memos m
     LEFT JOIN memo_tag_map mtm ON m.memo_id = mtm.memo_id
     LEFT JOIN memo_tags t ON mtm.tag_id = t.tag_id
     WHERE m.bible_id = ? AND m.book_id = ? AND m.chapter = ? AND m.verse_num = ?
       AND m.is_deleted = 0
     GROUP BY m.memo_id
     ORDER BY m.created_at DESC`,
    [bibleId, bookId, chapter, verseNum]
  );
}

/**
 * 특정 구절의 메모 목록 조회 (bible_id 무관)
 */
export async function getMemosByVerseLocation(
  bookId: number,
  chapter: number,
  verseNum: number
): Promise<Memo[]> {
  if (isWeb) {
    return webMemos.filter(
      m => m.book_id === bookId &&
           m.chapter === chapter &&
           m.verse_num === verseNum && !m.is_deleted
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<Memo>(
    `SELECT m.*, GROUP_CONCAT(t.tag_name) as tags
     FROM memos m
     LEFT JOIN memo_tag_map mtm ON m.memo_id = mtm.memo_id
     LEFT JOIN memo_tags t ON mtm.tag_id = t.tag_id
     WHERE m.book_id = ? AND m.chapter = ? AND m.verse_num = ?
       AND m.is_deleted = 0
     GROUP BY m.memo_id
     ORDER BY m.created_at DESC`,
    [bookId, chapter, verseNum]
  );
}

/**
 * 모든 메모 목록 조회
 */
export async function getAllMemos(limit: number = 50, offset: number = 0): Promise<Memo[]> {
  if (isWeb) {
    return webMemos
      .filter(m => !m.is_deleted)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit);
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<Memo>(
    `SELECT m.*, GROUP_CONCAT(t.tag_name) as tags
     FROM memos m
     LEFT JOIN memo_tag_map mtm ON m.memo_id = mtm.memo_id
     LEFT JOIN memo_tags t ON mtm.tag_id = t.tag_id
     WHERE m.is_deleted = 0
     GROUP BY m.memo_id
     ORDER BY m.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

/**
 * 태그별 메모 조회
 */
export async function getMemosByTag(tagId: number): Promise<Memo[]> {
  if (isWeb) {
    return webMemos.filter(m => !m.is_deleted);
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<Memo>(
    `SELECT m.*, GROUP_CONCAT(t.tag_name) as tags
     FROM memos m
     JOIN memo_tag_map mtm ON m.memo_id = mtm.memo_id
     LEFT JOIN memo_tags t ON mtm.tag_id = t.tag_id
     WHERE mtm.tag_id = ? AND m.is_deleted = 0
     GROUP BY m.memo_id
     ORDER BY m.created_at DESC`,
    [tagId]
  );
}

// ============================================
// 태그 CRUD
// ============================================

let webTagIdCounter = 1;

/**
 * 태그 생성
 */
export async function createTag(dto: CreateTagDto): Promise<number> {
  const now = getCurrentISOTime();

  if (isWeb) {
    const tagId = webTagIdCounter++;
    webTags.push({
      tag_id: tagId,
      tag_name: dto.tag_name,
      color: dto.color ?? '#3B82F6',
      created_at: now,
    });
    return tagId;
  }

  const db = databaseService.getUserDb();

  const result = await db.runAsync(
    'INSERT INTO memo_tags (tag_name, color, created_at) VALUES (?, ?, ?)',
    [dto.tag_name, dto.color ?? '#3B82F6', now]
  );

  return result.lastInsertRowId;
}

/**
 * 모든 태그 조회
 */
export async function getAllTags(): Promise<MemoTag[]> {
  if (isWeb) {
    return [...webTags].sort((a, b) => a.tag_name.localeCompare(b.tag_name));
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<MemoTag>(
    'SELECT * FROM memo_tags ORDER BY tag_name'
  );
}

/**
 * 태그 삭제
 */
export async function deleteTag(tagId: number): Promise<void> {
  if (isWeb) {
    const idx = webTags.findIndex(t => t.tag_id === tagId);
    if (idx !== -1) webTags.splice(idx, 1);
    return;
  }

  const db = databaseService.getUserDb();
  await db.runAsync('DELETE FROM memo_tag_map WHERE tag_id = ?', [tagId]);
  await db.runAsync('DELETE FROM memo_tags WHERE tag_id = ?', [tagId]);
}

// ============================================
// 북마크 CRUD
// ============================================

/**
 * 북마크 생성
 */
export async function createBookmark(dto: CreateBookmarkDto): Promise<string> {
  const bookmarkId = generateUUID();
  const now = getCurrentISOTime();

  if (isWeb) {
    webBookmarks.push({
      bookmark_id: bookmarkId,
      bible_id: dto.bible_id,
      book_id: dto.book_id,
      chapter: dto.chapter,
      verse_num: dto.verse_num ?? null,
      title: dto.title ?? null,
      created_at: now,
    });
    return bookmarkId;
  }

  const db = databaseService.getUserDb();

  await db.runAsync(
    `INSERT INTO bookmarks (bookmark_id, bible_id, book_id, chapter, verse_num, title, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [bookmarkId, dto.bible_id, dto.book_id, dto.chapter, dto.verse_num ?? null, dto.title ?? null, now]
  );

  return bookmarkId;
}

/**
 * 북마크 삭제
 */
export async function deleteBookmark(bookmarkId: string): Promise<void> {
  if (isWeb) {
    const idx = webBookmarks.findIndex(b => b.bookmark_id === bookmarkId);
    if (idx !== -1) webBookmarks.splice(idx, 1);
    return;
  }

  const db = databaseService.getUserDb();
  await db.runAsync('DELETE FROM bookmarks WHERE bookmark_id = ?', [bookmarkId]);
}

/**
 * 모든 북마크 조회
 */
export async function getAllBookmarks(): Promise<Bookmark[]> {
  if (isWeb) {
    return [...webBookmarks].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<Bookmark>(
    'SELECT * FROM bookmarks ORDER BY created_at DESC'
  );
}

/**
 * 특정 구절 북마크 확인
 */
export async function getBookmarkByVerse(
  bibleId: string,
  bookId: number,
  chapter: number,
  verseNum?: number
): Promise<Bookmark | null> {
  if (isWeb) {
    if (verseNum !== undefined) {
      return webBookmarks.find(
        b => b.bible_id === bibleId && b.book_id === bookId &&
             b.chapter === chapter && b.verse_num === verseNum
      ) ?? null;
    }
    return webBookmarks.find(
      b => b.bible_id === bibleId && b.book_id === bookId &&
           b.chapter === chapter && b.verse_num === null
    ) ?? null;
  }

  const db = databaseService.getUserDb();

  if (verseNum !== undefined) {
    return await db.getFirstAsync<Bookmark>(
      `SELECT * FROM bookmarks
       WHERE bible_id = ? AND book_id = ? AND chapter = ? AND verse_num = ?`,
      [bibleId, bookId, chapter, verseNum]
    );
  } else {
    return await db.getFirstAsync<Bookmark>(
      `SELECT * FROM bookmarks
       WHERE bible_id = ? AND book_id = ? AND chapter = ? AND verse_num IS NULL`,
      [bibleId, bookId, chapter]
    );
  }
}

// ============================================
// 하이라이트 CRUD
// ============================================

/**
 * 하이라이트 생성
 */
export async function createHighlight(dto: CreateHighlightDto): Promise<string> {
  const highlightId = generateUUID();
  const now = getCurrentISOTime();

  if (isWeb) {
    webHighlights.push({
      highlight_id: highlightId,
      verse_id: dto.verse_id,
      bible_id: dto.bible_id,
      book_id: dto.book_id,
      chapter: dto.chapter,
      verse_num: dto.verse_num,
      color: dto.color ?? '#FBBF24',
      created_at: now,
    });
    return highlightId;
  }

  const db = databaseService.getUserDb();

  await db.runAsync(
    `INSERT INTO highlights (highlight_id, verse_id, bible_id, book_id, chapter, verse_num, color, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [highlightId, dto.verse_id, dto.bible_id, dto.book_id, dto.chapter, dto.verse_num, dto.color ?? '#FBBF24', now]
  );

  return highlightId;
}

/**
 * 하이라이트 삭제
 */
export async function deleteHighlight(highlightId: string): Promise<void> {
  if (isWeb) {
    const idx = webHighlights.findIndex(h => h.highlight_id === highlightId);
    if (idx !== -1) webHighlights.splice(idx, 1);
    return;
  }

  const db = databaseService.getUserDb();
  await db.runAsync('DELETE FROM highlights WHERE highlight_id = ?', [highlightId]);
}

/**
 * 구절별 하이라이트 삭제
 */
export async function deleteHighlightByVerse(verseId: number): Promise<void> {
  if (isWeb) {
    const idx = webHighlights.findIndex(h => h.verse_id === verseId);
    if (idx !== -1) webHighlights.splice(idx, 1);
    return;
  }

  const db = databaseService.getUserDb();
  await db.runAsync('DELETE FROM highlights WHERE verse_id = ?', [verseId]);
}

/**
 * 특정 장의 하이라이트 조회
 */
export async function getHighlightsByChapter(
  bibleId: string,
  bookId: number,
  chapter: number
): Promise<Highlight[]> {
  if (isWeb) {
    return webHighlights.filter(
      h => h.bible_id === bibleId && h.book_id === bookId && h.chapter === chapter
    );
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<Highlight>(
    `SELECT * FROM highlights
     WHERE bible_id = ? AND book_id = ? AND chapter = ?`,
    [bibleId, bookId, chapter]
  );
}

// ============================================
// 통계/분석
// ============================================

/**
 * 자주 묵상한 구절 TOP N
 */
export async function getTopVerses(langId: string, limit: number = 10): Promise<TopVerse[]> {
  if (isWeb) {
    // 웹에서는 빈 배열 반환
    return [];
  }

  const userDb = databaseService.getUserDb();
  const bibleDb = databaseService.getBibleDb();

  // 먼저 메모 통계 조회
  const memoStats = await userDb.getAllAsync<{ book_id: number; chapter: number; verse_num: number; memo_count: number }>(
    `SELECT book_id, chapter, verse_num, COUNT(*) as memo_count
     FROM memos
     WHERE is_deleted = 0
     GROUP BY book_id, chapter, verse_num
     ORDER BY memo_count DESC
     LIMIT ?`,
    [limit]
  );

  // 책 이름 조회하여 결합
  const results: TopVerse[] = [];
  for (const stat of memoStats) {
    const bookName = await bibleDb.getFirstAsync<{ book_name: string }>(
      'SELECT book_name FROM book_names WHERE book_id = ? AND lang_id = ?',
      [stat.book_id, langId]
    );

    const bookNameValue = bookName?.book_name ?? '';
    results.push({
      book_id: stat.book_id,
      bookId: stat.book_id,
      chapter: stat.chapter,
      verse_num: stat.verse_num,
      verseNum: stat.verse_num,
      book_name: bookNameValue,
      bookName: bookNameValue,
      memo_count: stat.memo_count,
      count: stat.memo_count,
    });
  }

  return results;
}

/**
 * 일별 묵상 통계 (최근 N일)
 */
export async function getDailyStats(days: number = 30): Promise<DailyStat[]> {
  if (isWeb) {
    return [];
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<DailyStat>(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM memos
     WHERE is_deleted = 0
       AND created_at >= DATE('now', '-' || ? || ' days')
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [days]
  );
}

/**
 * 월별 묵상 통계 (최근 N개월)
 */
export async function getMonthlyStats(months: number = 12): Promise<MonthlyStat[]> {
  if (isWeb) {
    return [];
  }

  const db = databaseService.getUserDb();
  return await db.getAllAsync<MonthlyStat>(
    `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
     FROM memos
     WHERE is_deleted = 0
     GROUP BY strftime('%Y-%m', created_at)
     ORDER BY month DESC
     LIMIT ?`,
    [months]
  );
}

/**
 * 총 메모 개수
 */
export async function getTotalMemoCount(): Promise<number> {
  if (isWeb) {
    return webMemos.filter(m => !m.is_deleted).length;
  }

  const db = databaseService.getUserDb();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM memos WHERE is_deleted = 0'
  );
  return result?.count ?? 0;
}

/**
 * 총 북마크 개수
 */
export async function getTotalBookmarkCount(): Promise<number> {
  if (isWeb) {
    return webBookmarks.length;
  }

  const db = databaseService.getUserDb();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM bookmarks'
  );
  return result?.count ?? 0;
}

// ============================================
// AI 분석 데이터 저장/조회
// ============================================

/**
 * 메모의 감정분석 데이터 저장
 */
export async function updateMemoEmotionData(memoId: string, emotionDataJson: string): Promise<void> {
  if (isWeb) return;
  const db = databaseService.getUserDb();
  await db.runAsync(
    'UPDATE memos SET emotion_data = ?, updated_at = ? WHERE memo_id = ?',
    [emotionDataJson, getCurrentISOTime(), memoId]
  );
}

/**
 * 메모의 묵상 피드백 데이터 저장
 */
export async function updateMemoFeedbackData(memoId: string, feedbackDataJson: string): Promise<void> {
  if (isWeb) return;
  const db = databaseService.getUserDb();
  await db.runAsync(
    'UPDATE memos SET feedback_data = ?, updated_at = ? WHERE memo_id = ?',
    [feedbackDataJson, getCurrentISOTime(), memoId]
  );
}

/**
 * AI 분석 히스토리 추가
 */
export async function addAnalysisHistory(
  memoId: string,
  analysisType: 'emotion' | 'feedback',
  resultDataJson: string
): Promise<void> {
  if (isWeb) return;
  const db = databaseService.getUserDb();
  const historyId = generateUUID();
  await db.runAsync(
    `INSERT INTO ai_analysis_history (history_id, memo_id, analysis_type, result_data, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [historyId, memoId, analysisType, resultDataJson, getCurrentISOTime()]
  );
}

/**
 * AI 분석 히스토리 조회
 */
export async function getAnalysisHistory(
  memoId: string,
  analysisType: 'emotion' | 'feedback'
): Promise<Array<{ history_id: string; result_data: string; created_at: string }>> {
  if (isWeb) return [];
  const db = databaseService.getUserDb();
  return await db.getAllAsync<{ history_id: string; result_data: string; created_at: string }>(
    `SELECT history_id, result_data, created_at
     FROM ai_analysis_history
     WHERE memo_id = ? AND analysis_type = ?
     ORDER BY created_at DESC`,
    [memoId, analysisType]
  );
}
