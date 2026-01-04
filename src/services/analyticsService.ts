// src/services/analyticsService.ts
// 통계 및 분석 서비스

import { Platform } from 'react-native';
import { databaseService } from './database';
import {
  getTopVerses,
  getDailyStats,
  getMonthlyStats,
  getTotalMemoCount,
  getTotalBookmarkCount,
  getAllTags,
} from './database/memoQueries';
import type { TopVerse, DailyStat, MonthlyStat, Memo } from '../types/database';
import { AppError, ErrorCode } from '../utils/errorCodes';

const isWeb = Platform.OS === 'web';

// ============================================
// 인터페이스 정의
// ============================================

interface AnalyticsSummary {
  totalMemos: number;
  totalBookmarks: number;
  thisWeekMemos: number;
  thisMonthMemos: number;
  streakDays: number; // 연속 묵상 일수
}

interface TagStat {
  tagId: number;
  tagName: string;
  color: string;
  count: number;
  percentage: number;
}

interface VerseHistory {
  totalCount: number;
  firstMemoDate: string | null;
  lastMemoDate: string | null;
  memos: Memo[];
}

interface DayOfWeekStat {
  dayOfWeek: number; // 0-6 (일-토)
  dayName: string;
  count: number;
}

class AnalyticsService {
  /**
   * 전체 요약 통계
   */
  async getSummary(): Promise<AnalyticsSummary> {
    try {
      // 총 메모 수
      const totalMemos = await getTotalMemoCount();

      // 총 북마크 수
      const totalBookmarks = await getTotalBookmarkCount();

      if (isWeb) {
        return {
          totalMemos,
          totalBookmarks,
          thisWeekMemos: 0,
          thisMonthMemos: 0,
          streakDays: 0,
        };
      }

      const db = databaseService.getUserDb();

      // 이번 주 메모 수
      const thisWeekResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM memos
         WHERE is_deleted = 0
         AND created_at >= date('now', 'weekday 0', '-7 days')`
      );
      const thisWeekMemos = thisWeekResult?.count ?? 0;

      // 이번 달 메모 수
      const thisMonthResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM memos
         WHERE is_deleted = 0
         AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
      );
      const thisMonthMemos = thisMonthResult?.count ?? 0;

      // 연속 묵상 일수
      const streakDays = await this.calculateStreak();

      return {
        totalMemos,
        totalBookmarks,
        thisWeekMemos,
        thisMonthMemos,
        streakDays,
      };
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '통계 요약 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 자주 묵상한 구절 TOP N
   * @param langId - 책 이름 표시 언어
   * @param limit - 결과 개수 (기본 10)
   */
  async getTopVerses(langId: string, limit: number = 10): Promise<TopVerse[]> {
    try {
      return await getTopVerses(langId, limit);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        'TOP 구절 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 일별 묵상 통계
   * @param days - 최근 N일 (기본 30)
   */
  async getDailyStats(days: number = 30): Promise<DailyStat[]> {
    try {
      return await getDailyStats(days);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '일별 통계 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 월별 묵상 통계
   * @param months - 최근 N개월 (기본 12)
   */
  async getMonthlyStats(months: number = 12): Promise<MonthlyStat[]> {
    try {
      return await getMonthlyStats(months);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '월별 통계 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 태그별 분포
   */
  async getTagStats(): Promise<TagStat[]> {
    try {
      if (isWeb) {
        return [];
      }

      const db = databaseService.getUserDb();

      // 태그별 메모 수 조회
      const tagCounts = await db.getAllAsync<{
        tag_id: number;
        tag_name: string;
        color: string;
        count: number;
      }>(
        `SELECT t.tag_id, t.tag_name, t.color, COUNT(mtm.memo_id) as count
         FROM memo_tags t
         LEFT JOIN memo_tag_map mtm ON t.tag_id = mtm.tag_id
         LEFT JOIN memos m ON mtm.memo_id = m.memo_id AND m.is_deleted = 0
         GROUP BY t.tag_id
         ORDER BY count DESC`
      );

      // 총 개수 계산
      const total = tagCounts.reduce((sum, tag) => sum + tag.count, 0);

      // 퍼센티지 계산
      return tagCounts.map((tag) => ({
        tagId: tag.tag_id,
        tagName: tag.tag_name,
        color: tag.color,
        count: tag.count,
        percentage: total > 0 ? Math.round((tag.count / total) * 100) : 0,
      }));
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '태그 통계 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 특정 구절의 묵상 히스토리
   */
  async getVerseHistory(
    bookId: number,
    chapter: number,
    verseNum: number,
    langId: string
  ): Promise<VerseHistory> {
    try {
      if (isWeb) {
        return {
          totalCount: 0,
          firstMemoDate: null,
          lastMemoDate: null,
          memos: [],
        };
      }

      const db = databaseService.getUserDb();

      // 메모 목록 조회
      const memos = await db.getAllAsync<Memo>(
        `SELECT * FROM memos
         WHERE book_id = ? AND chapter = ? AND verse_num = ? AND is_deleted = 0
         ORDER BY created_at DESC`,
        [bookId, chapter, verseNum]
      );

      // 첫 번째/마지막 메모 날짜
      const dateRange = await db.getFirstAsync<{
        first_date: string | null;
        last_date: string | null;
      }>(
        `SELECT MIN(created_at) as first_date, MAX(created_at) as last_date
         FROM memos
         WHERE book_id = ? AND chapter = ? AND verse_num = ? AND is_deleted = 0`,
        [bookId, chapter, verseNum]
      );

      return {
        totalCount: memos.length,
        firstMemoDate: dateRange?.first_date ?? null,
        lastMemoDate: dateRange?.last_date ?? null,
        memos,
      };
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '구절 히스토리 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 연속 묵상 기록 계산
   */
  async calculateStreak(): Promise<number> {
    try {
      if (isWeb) {
        return 0;
      }

      const db = databaseService.getUserDb();

      // 메모가 있는 날짜 목록 (최근 순)
      const dates = await db.getAllAsync<{ date: string }>(
        `SELECT DISTINCT DATE(created_at) as date
         FROM memos
         WHERE is_deleted = 0
         ORDER BY date DESC
         LIMIT 365`
      );

      if (dates.length === 0) {
        return 0;
      }

      // 오늘 날짜
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 연속 일수 계산
      let streak = 0;
      let expectedDate = today;

      for (const { date } of dates) {
        const memoDate = new Date(date);
        memoDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (expectedDate.getTime() - memoDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
          // 해당 날짜에 메모 있음
          streak++;
          expectedDate = new Date(memoDate);
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (diffDays === 1 && streak === 0) {
          // 오늘은 없지만 어제부터 시작
          streak = 1;
          expectedDate = new Date(memoDate);
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          // 연속 끊김
          break;
        }
      }

      return streak;
    } catch {
      return 0;
    }
  }

  /**
   * 가장 활발했던 요일
   */
  async getMostActiveDay(): Promise<DayOfWeekStat | null> {
    try {
      if (isWeb) {
        return null;
      }

      const db = databaseService.getUserDb();

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

      // 요일별 메모 수 조회
      const dayCounts = await db.getAllAsync<{
        day_of_week: number;
        count: number;
      }>(
        `SELECT CAST(strftime('%w', created_at) AS INTEGER) as day_of_week,
                COUNT(*) as count
         FROM memos
         WHERE is_deleted = 0
         GROUP BY day_of_week
         ORDER BY count DESC
         LIMIT 1`
      );

      if (dayCounts.length === 0) {
        return null;
      }

      const mostActive = dayCounts[0];
      return {
        dayOfWeek: mostActive.day_of_week,
        dayName: dayNames[mostActive.day_of_week],
        count: mostActive.count,
      };
    } catch {
      return null;
    }
  }

  /**
   * 요일별 통계
   */
  async getDayOfWeekStats(): Promise<DayOfWeekStat[]> {
    try {
      if (isWeb) {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        return dayNames.map((name, i) => ({ dayOfWeek: i, dayName: name, count: 0 }));
      }

      const db = databaseService.getUserDb();

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

      // 요일별 메모 수 조회
      const dayCounts = await db.getAllAsync<{
        day_of_week: number;
        count: number;
      }>(
        `SELECT CAST(strftime('%w', created_at) AS INTEGER) as day_of_week,
                COUNT(*) as count
         FROM memos
         WHERE is_deleted = 0
         GROUP BY day_of_week
         ORDER BY day_of_week`
      );

      // 모든 요일에 대한 결과 생성
      const result: DayOfWeekStat[] = [];
      for (let i = 0; i < 7; i++) {
        const found = dayCounts.find((d) => d.day_of_week === i);
        result.push({
          dayOfWeek: i,
          dayName: dayNames[i],
          count: found?.count ?? 0,
        });
      }

      return result;
    } catch {
      return [];
    }
  }

  /**
   * 책별 통계
   */
  async getBookStats(langId: string): Promise<{
    bookId: number;
    bookName: string;
    count: number;
  }[]> {
    try {
      if (isWeb) {
        return [];
      }

      const userDb = databaseService.getUserDb();
      const bibleDb = databaseService.getBibleDb();

      // 책별 메모 수 조회
      const bookCounts = await userDb.getAllAsync<{
        book_id: number;
        count: number;
      }>(
        `SELECT book_id, COUNT(*) as count
         FROM memos
         WHERE is_deleted = 0
         GROUP BY book_id
         ORDER BY count DESC`
      );

      // 책 이름 조회하여 결합
      const result = await Promise.all(
        bookCounts.map(async (book) => {
          const bookName = await bibleDb.getFirstAsync<{ book_name: string }>(
            'SELECT book_name FROM book_names WHERE book_id = ? AND lang_id = ?',
            [book.book_id, langId]
          );

          return {
            bookId: book.book_id,
            bookName: bookName?.book_name ?? `Book ${book.book_id}`,
            count: book.count,
          };
        })
      );

      return result;
    } catch {
      return [];
    }
  }

  /**
   * 최근 활동
   */
  async getRecentActivity(limit: number = 10): Promise<{
    type: 'memo' | 'bookmark' | 'highlight';
    date: string;
    bookId: number;
    chapter: number;
    verseNum?: number;
  }[]> {
    try {
      if (isWeb) {
        return [];
      }

      const db = databaseService.getUserDb();

      // 최근 메모
      const memos = await db.getAllAsync<{
        type: string;
        date: string;
        book_id: number;
        chapter: number;
        verse_num: number;
      }>(
        `SELECT 'memo' as type, created_at as date, book_id, chapter, verse_num
         FROM memos
         WHERE is_deleted = 0
         ORDER BY created_at DESC
         LIMIT ?`,
        [limit]
      );

      // 최근 북마크
      const bookmarks = await db.getAllAsync<{
        type: string;
        date: string;
        book_id: number;
        chapter: number;
        verse_num: number | null;
      }>(
        `SELECT 'bookmark' as type, created_at as date, book_id, chapter, verse_num
         FROM bookmarks
         ORDER BY created_at DESC
         LIMIT ?`,
        [limit]
      );

      // 최근 하이라이트
      const highlights = await db.getAllAsync<{
        type: string;
        date: string;
        book_id: number;
        chapter: number;
        verse_num: number;
      }>(
        `SELECT 'highlight' as type, created_at as date, book_id, chapter, verse_num
         FROM highlights
         ORDER BY created_at DESC
         LIMIT ?`,
        [limit]
      );

      // 합치고 정렬
      const all = [...memos, ...bookmarks, ...highlights]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

      return all.map((item) => ({
        type: item.type as 'memo' | 'bookmark' | 'highlight',
        date: item.date,
        bookId: item.book_id,
        chapter: item.chapter,
        verseNum: item.verse_num ?? undefined,
      }));
    } catch {
      return [];
    }
  }
}

export const analyticsService = new AnalyticsService();
