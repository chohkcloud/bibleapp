// src/services/memoService.ts
// 묵상 메모 CRUD 서비스

import { Platform } from 'react-native';
import { databaseService } from './database';
import { authService } from './authService';
import { encrypt, decrypt } from '../utils/crypto';
import { chocoService } from './chocoService';

const isWeb = Platform.OS === 'web';
import {
  createMemo,
  updateMemo,
  deleteMemo,
  permanentDeleteMemo,
  getMemoById,
  getMemosByVerse,
  getAllMemos,
  getMemosByTag,
  createTag,
  getAllTags,
  deleteTag,
  createBookmark,
  deleteBookmark,
  getAllBookmarks,
  getBookmarkByVerse,
  createHighlight,
  deleteHighlight,
  deleteHighlightByVerse,
  getHighlightsByChapter,
} from './database/memoQueries';
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
} from '../types/database';
import { AppError, ErrorCode } from '../utils/errorCodes';

// ============================================
// 입력 인터페이스
// ============================================

interface CreateMemoInput {
  verseId: number;
  bibleId: string;
  bookId: number;
  chapter: number;
  verseNum: number;
  verseStart?: number;    // 범위 선택 시 시작 절
  verseEnd?: number;      // 범위 선택 시 끝 절
  verseRange?: string;    // 범위 문자열 (예: "1-16")
  content: string;
  tagIds?: number[];
  tags?: string;
}

interface UpdateMemoInput {
  content?: string;
  tagIds?: number[];
  tags?: string;
}

interface MemoFilter {
  bookId?: number;
  chapter?: number;
  verseNum?: number;
  tagId?: number;
  startDate?: string; // ISO 8601
  endDate?: string;
}

class MemoService {
  // ============================================
  // 메모 CRUD
  // ============================================

  /**
   * 메모 생성 (암호화 적용)
   * @param input - 메모 데이터
   * @returns 생성된 메모 ID
   */
  async createMemo(input: CreateMemoInput): Promise<string> {
    try {
      // 암호화 키 조회
      const encryptionKey = await authService.getEncryptionKey();

      // 내용 암호화
      const encryptedContent = await encrypt(input.content, encryptionKey);

      // 메모 생성
      const dto: CreateMemoDto = {
        verse_id: input.verseId,
        bible_id: input.bibleId,
        book_id: input.bookId,
        chapter: input.chapter,
        verse_num: input.verseNum,
        verse_start: input.verseStart,
        verse_end: input.verseEnd,
        verse_range: input.verseRange,
        content: encryptedContent,
        tags: input.tagIds,
      };

      const memoId = await createMemo(dto);

      // 감정분석 실행 (백그라운드, 비동기)
      this.triggerEmotionAnalysis(input.content);

      return memoId;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.MEMO_CREATE_FAILED,
        '메모 생성에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 메모 조회 (복호화 적용)
   * @param memoId - 메모 ID
   */
  async getMemo(memoId: string): Promise<Memo | null> {
    try {
      const memo = await getMemoById(memoId);

      if (!memo) {
        return null;
      }

      // 암호화된 메모 복호화
      if (memo.is_encrypted) {
        const encryptionKey = await authService.getEncryptionKey();
        memo.content = await decrypt(memo.content, encryptionKey);
      }

      return memo;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.MEMO_NOT_FOUND,
        '메모를 찾을 수 없습니다.',
        error as Error
      );
    }
  }

  /**
   * 메모 목록 조회 (복호화 적용)
   * @param filter - 필터 조건
   * @param limit - 결과 개수
   * @param offset - 오프셋
   */
  async getMemos(
    filter?: MemoFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<Memo[]> {
    try {
      let memos: Memo[];

      if (filter?.tagId) {
        memos = await getMemosByTag(filter.tagId);
      } else {
        memos = await getAllMemos(limit, offset);
      }

      // 필터 적용
      if (filter) {
        memos = this.applyFilter(memos, filter);
      }

      // 복호화
      return await this.decryptMemos(memos);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '메모 목록 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 특정 구절의 메모 목록 (복호화 적용)
   * @param verseIdOrBibleId - verse_id 문자열 (예: "1_1_1") 또는 bibleId
   * @param bookId - 책 ID (verseIdOrBibleId가 bibleId인 경우)
   * @param chapter - 장 (verseIdOrBibleId가 bibleId인 경우)
   * @param verseNum - 절 (verseIdOrBibleId가 bibleId인 경우)
   */
  async getMemosByVerse(
    verseIdOrBibleId: string,
    bookId?: number,
    chapter?: number,
    verseNum?: number
  ): Promise<Memo[]> {
    try {
      // 단일 인자인 경우 (verse_id 형식: "bookId_chapter_verseNum")
      if (bookId === undefined) {
        const parts = verseIdOrBibleId.split('_');
        if (parts.length >= 3) {
          const parsedBookId = parseInt(parts[0], 10);
          const parsedChapter = parseInt(parts[1], 10);
          const parsedVerseNum = parseInt(parts[2], 10);
          const memos = await getMemosByVerse('KRV', parsedBookId, parsedChapter, parsedVerseNum);
          return await this.decryptMemos(this.addIdAlias(memos));
        }
        return [];
      }

      // 4개 인자인 경우
      const memos = await getMemosByVerse(verseIdOrBibleId, bookId, chapter!, verseNum!);
      return await this.decryptMemos(this.addIdAlias(memos));
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '메모 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * id 별칭 추가 헬퍼
   */
  private addIdAlias(memos: Memo[]): Memo[] {
    return memos.map(memo => ({
      ...memo,
      id: memo.memo_id,
    }));
  }

  /**
   * 메모 수정 (암호화 적용)
   */
  async updateMemo(memoId: string, input: UpdateMemoInput): Promise<void> {
    try {
      const dto: UpdateMemoDto = {};

      if (input.content !== undefined) {
        // 암호화 키 조회
        const encryptionKey = await authService.getEncryptionKey();
        dto.content = await encrypt(input.content, encryptionKey);

        // 감정분석 실행 (백그라운드, 비동기)
        this.triggerEmotionAnalysis(input.content);
      }

      if (input.tagIds !== undefined) {
        dto.tags = input.tagIds;
      }

      await updateMemo(memoId, dto);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.MEMO_UPDATE_FAILED,
        '메모 수정에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 감정분석 트리거 (백그라운드 실행)
   * API 활성화 체크 후 분석 실행
   * 비활성화 시 3시간 후 재시도
   */
  private triggerEmotionAnalysis(content: string): void {
    // 비동기로 실행 (저장 흐름을 블로킹하지 않음)
    chocoService.analyzeOnSave(content).then(result => {
      if (result) {
        console.log(`[MemoService] 감정분석 완료: ${result.main_emotion}`);
      }
    }).catch(error => {
      console.log('[MemoService] 감정분석 에러:', error);
    });
  }

  /**
   * 메모 삭제 (Soft Delete)
   */
  async deleteMemo(memoId: string): Promise<void> {
    try {
      await deleteMemo(memoId);
    } catch (error) {
      throw new AppError(
        ErrorCode.MEMO_DELETE_FAILED,
        '메모 삭제에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 메모 영구 삭제
   */
  async permanentDeleteMemo(memoId: string): Promise<void> {
    try {
      await permanentDeleteMemo(memoId);
    } catch (error) {
      throw new AppError(
        ErrorCode.MEMO_DELETE_FAILED,
        '메모 영구 삭제에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 삭제된 메모 복원
   */
  async restoreMemo(memoId: string): Promise<void> {
    try {
      if (isWeb) {
        console.log('[MemoService] 웹 환경 - 메모 복원 스킵');
        return;
      }

      const db = databaseService.getUserDb();
      const now = new Date().toISOString();

      await db.runAsync(
        'UPDATE memos SET is_deleted = 0, updated_at = ? WHERE memo_id = ?',
        [now, memoId]
      );
    } catch (error) {
      throw new AppError(
        ErrorCode.MEMO_UPDATE_FAILED,
        '메모 복원에 실패했습니다.',
        error as Error
      );
    }
  }

  // ============================================
  // 태그 관련
  // ============================================

  /**
   * 태그 목록 조회
   */
  async getTags(): Promise<MemoTag[]> {
    try {
      return await getAllTags();
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '태그 목록 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 태그 생성
   */
  async createTag(name: string, color: string = '#3B82F6'): Promise<number> {
    try {
      const dto: CreateTagDto = {
        tag_name: name,
        color,
      };
      return await createTag(dto);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '태그 생성에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 태그 삭제
   */
  async deleteTag(tagId: number): Promise<void> {
    try {
      await deleteTag(tagId);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '태그 삭제에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 메모에 태그 추가
   */
  async addTagToMemo(memoId: string, tagId: number): Promise<void> {
    try {
      if (isWeb) {
        console.log('[MemoService] 웹 환경 - 태그 추가 스킵');
        return;
      }

      const db = databaseService.getUserDb();
      await db.runAsync(
        'INSERT OR IGNORE INTO memo_tag_map (memo_id, tag_id) VALUES (?, ?)',
        [memoId, tagId]
      );
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '태그 추가에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 메모에서 태그 제거
   */
  async removeTagFromMemo(memoId: string, tagId: number): Promise<void> {
    try {
      if (isWeb) {
        console.log('[MemoService] 웹 환경 - 태그 제거 스킵');
        return;
      }

      const db = databaseService.getUserDb();
      await db.runAsync(
        'DELETE FROM memo_tag_map WHERE memo_id = ? AND tag_id = ?',
        [memoId, tagId]
      );
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '태그 제거에 실패했습니다.',
        error as Error
      );
    }
  }

  // ============================================
  // 북마크 관련
  // ============================================

  /**
   * 북마크 생성
   */
  async createBookmark(
    bibleId: string,
    bookId: number,
    chapter: number,
    verseNum?: number,
    title?: string
  ): Promise<string> {
    try {
      const dto: CreateBookmarkDto = {
        bible_id: bibleId,
        book_id: bookId,
        chapter,
        verse_num: verseNum,
        title,
      };
      return await createBookmark(dto);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '북마크 생성에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 북마크 삭제
   */
  async deleteBookmark(bookmarkId: string): Promise<void> {
    try {
      await deleteBookmark(bookmarkId);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '북마크 삭제에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 모든 북마크 조회
   */
  async getAllBookmarks(): Promise<Bookmark[]> {
    try {
      return await getAllBookmarks();
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '북마크 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 특정 구절 북마크 여부 확인
   */
  async isBookmarked(
    bibleId: string,
    bookId: number,
    chapter: number,
    verseNum?: number
  ): Promise<Bookmark | null> {
    try {
      return await getBookmarkByVerse(bibleId, bookId, chapter, verseNum);
    } catch {
      return null;
    }
  }

  /**
   * 북마크 토글
   */
  async toggleBookmark(
    bibleId: string,
    bookId: number,
    chapter: number,
    verseNum?: number
  ): Promise<boolean> {
    const existing = await this.isBookmarked(bibleId, bookId, chapter, verseNum);

    if (existing) {
      await this.deleteBookmark(existing.bookmark_id);
      return false; // 북마크 제거됨
    } else {
      await this.createBookmark(bibleId, bookId, chapter, verseNum);
      return true; // 북마크 추가됨
    }
  }

  // ============================================
  // 하이라이트 관련
  // ============================================

  /**
   * 하이라이트 생성
   */
  async createHighlight(
    verseId: number,
    bibleId: string,
    bookId: number,
    chapter: number,
    verseNum: number,
    color: string = '#FBBF24'
  ): Promise<string> {
    try {
      // 기존 하이라이트 삭제
      await deleteHighlightByVerse(verseId);

      const dto: CreateHighlightDto = {
        verse_id: verseId,
        bible_id: bibleId,
        book_id: bookId,
        chapter,
        verse_num: verseNum,
        color,
      };
      return await createHighlight(dto);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '하이라이트 생성에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 하이라이트 삭제
   */
  async deleteHighlight(highlightId: string): Promise<void> {
    try {
      await deleteHighlight(highlightId);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '하이라이트 삭제에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 구절 하이라이트 제거
   */
  async removeHighlightFromVerse(verseId: number): Promise<void> {
    try {
      await deleteHighlightByVerse(verseId);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '하이라이트 제거에 실패했습니다.',
        error as Error
      );
    }
  }

  /**
   * 특정 장의 하이라이트 조회
   */
  async getHighlightsByChapter(
    bibleId: string,
    bookId: number,
    chapter: number
  ): Promise<Highlight[]> {
    try {
      return await getHighlightsByChapter(bibleId, bookId, chapter);
    } catch (error) {
      throw new AppError(
        ErrorCode.DB_QUERY_FAILED,
        '하이라이트 조회에 실패했습니다.',
        error as Error
      );
    }
  }

  // ============================================
  // 헬퍼 메서드
  // ============================================

  /**
   * 메모 복호화 헬퍼
   */
  private async decryptMemos(memos: Memo[]): Promise<Memo[]> {
    try {
      const encryptionKey = await authService.getEncryptionKey();

      return await Promise.all(
        memos.map(async (memo) => {
          if (memo.is_encrypted) {
            try {
              memo.content = await decrypt(memo.content, encryptionKey);
            } catch {
              // 복호화 실패 시 원본 유지
            }
          }
          return memo;
        })
      );
    } catch {
      return memos;
    }
  }

  /**
   * 필터 적용 헬퍼
   */
  private applyFilter(memos: Memo[], filter: MemoFilter): Memo[] {
    return memos.filter((memo) => {
      if (filter.bookId !== undefined && memo.book_id !== filter.bookId) {
        return false;
      }
      if (filter.chapter !== undefined && memo.chapter !== filter.chapter) {
        return false;
      }
      if (filter.verseNum !== undefined && memo.verse_num !== filter.verseNum) {
        return false;
      }
      if (filter.startDate) {
        const memoDate = new Date(memo.created_at);
        const startDate = new Date(filter.startDate);
        if (memoDate < startDate) {
          return false;
        }
      }
      if (filter.endDate) {
        const memoDate = new Date(memo.created_at);
        const endDate = new Date(filter.endDate);
        if (memoDate > endDate) {
          return false;
        }
      }
      return true;
    });
  }
}

export const memoService = new MemoService();
