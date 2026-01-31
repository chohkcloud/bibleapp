// src/services/backupService.ts
// 묵상노트 백업/복원 서비스

import { Platform, Alert } from 'react-native';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { databaseService } from './database';
import { authService } from './authService';
import { decrypt, encrypt } from '../utils/crypto';

const isWeb = Platform.OS === 'web';

// 백업 데이터 타입
interface BackupMemo {
  memo_id: string;
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  verse_start?: number | null;
  verse_end?: number | null;
  verse_range?: string | null;
  content: string; // 복호화된 내용
  tags: string | null;
  emotion_data?: string | null;
  feedback_data?: string | null;
  bible_text?: string | null;
  created_at: string;
  updated_at: string;
}

interface BackupTag {
  tag_id: number;
  tag_name: string;
  color: string;
  created_at: string;
}

interface BackupBookmark {
  bookmark_id: string;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number | null;
  title: string | null;
  created_at: string;
}

interface BackupHighlight {
  highlight_id: string;
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  color: string;
  created_at: string;
}

interface BackupData {
  version: string;
  created_at: string;
  app_name: string;
  memos: BackupMemo[];
  tags: BackupTag[];
  bookmarks: BackupBookmark[];
  highlights: BackupHighlight[];
  memo_tag_map: { memo_id: string; tag_id: number }[];
}

class BackupService {
  private readonly BACKUP_VERSION = '1.0.0';

  /**
   * 전체 데이터 백업 (JSON 파일 생성)
   */
  async createBackup(): Promise<string | null> {
    if (isWeb) {
      Alert.alert('알림', '웹에서는 백업 기능을 사용할 수 없습니다.');
      return null;
    }

    try {
      const db = databaseService.getUserDb();
      if (!db) {
        throw new Error('데이터베이스가 초기화되지 않았습니다.');
      }

      // 암호화 키 가져오기
      const encryptionKey = await authService.getEncryptionKey();

      // 메모 조회 (삭제되지 않은 것만)
      const memos = await db.getAllAsync<any>(
        'SELECT * FROM memos WHERE is_deleted = 0 ORDER BY created_at DESC'
      );

      // 메모 복호화
      const decryptedMemos: BackupMemo[] = await Promise.all(
        memos.map(async (memo: any) => {
          let content = memo.content;
          if (memo.is_encrypted) {
            try {
              content = await decrypt(memo.content, encryptionKey);
            } catch {
              // 복호화 실패 시 원본 유지
            }
          }
          return {
            memo_id: memo.memo_id,
            verse_id: memo.verse_id,
            bible_id: memo.bible_id,
            book_id: memo.book_id,
            chapter: memo.chapter,
            verse_num: memo.verse_num,
            verse_start: memo.verse_start ?? null,
            verse_end: memo.verse_end ?? null,
            verse_range: memo.verse_range ?? null,
            content,
            tags: memo.tags,
            emotion_data: memo.emotion_data ?? null,
            feedback_data: memo.feedback_data ?? null,
            bible_text: memo.bible_text ?? null,
            created_at: memo.created_at,
            updated_at: memo.updated_at,
          };
        })
      );

      // 태그 조회
      const tags = await db.getAllAsync<BackupTag>(
        'SELECT * FROM memo_tags ORDER BY tag_name'
      );

      // 북마크 조회
      const bookmarks = await db.getAllAsync<BackupBookmark>(
        'SELECT * FROM bookmarks ORDER BY created_at DESC'
      );

      // 하이라이트 조회
      const highlights = await db.getAllAsync<BackupHighlight>(
        'SELECT * FROM highlights ORDER BY created_at DESC'
      );

      // 메모-태그 매핑 조회
      const memoTagMap = await db.getAllAsync<{ memo_id: string; tag_id: number }>(
        'SELECT * FROM memo_tag_map'
      );

      // 백업 데이터 구성
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        created_at: new Date().toISOString(),
        app_name: 'BibleApp',
        memos: decryptedMemos,
        tags: tags,
        bookmarks: bookmarks,
        highlights: highlights,
        memo_tag_map: memoTagMap,
      };

      // JSON 문자열로 변환
      const jsonString = JSON.stringify(backupData, null, 2);

      // 파일 저장 (expo-file-system v19 새 API)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `BibleApp_Backup_${timestamp}.json`;
      const backupFile = new File(Paths.cache, fileName);

      backupFile.write(jsonString);

      // 공유 다이얼로그 열기
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupFile.uri, {
          mimeType: 'application/json',
          dialogTitle: '묵상노트 백업 파일 저장',
          UTI: 'public.json',
        });
      }

      return backupFile.uri;
    } catch (error: any) {
      console.error('[BackupService] 백업 실패:', error);
      Alert.alert('백업 실패', `백업 파일 생성 중 오류가 발생했습니다.\n${error?.message || ''}`);
      return null;
    }
  }

  /**
   * 백업 파일에서 데이터 복원
   */
  async restoreBackup(): Promise<boolean> {
    if (isWeb) {
      Alert.alert('알림', '웹에서는 복원 기능을 사용할 수 없습니다.');
      return false;
    }

    try {
      const DocumentPicker = require('expo-document-picker');

      // 파일 선택
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return false;
      }

      const fileUri = result.assets[0].uri;

      // 파일 읽기 (expo-file-system v19 새 API)
      const pickedFile = new File(fileUri);
      const jsonString = await pickedFile.text();

      // JSON 파싱
      const backupData: BackupData = JSON.parse(jsonString);

      // 버전 확인
      if (!backupData.version || !backupData.app_name) {
        Alert.alert('오류', '올바른 백업 파일이 아닙니다.');
        return false;
      }

      // 복원 확인
      return new Promise((resolve) => {
        Alert.alert(
          '복원 확인',
          `백업 일시: ${new Date(backupData.created_at).toLocaleString()}\n\n` +
          `메모: ${backupData.memos?.length || 0}개\n` +
          `북마크: ${backupData.bookmarks?.length || 0}개\n` +
          `하이라이트: ${backupData.highlights?.length || 0}개\n\n` +
          '기존 데이터와 병합됩니다. 계속하시겠습니까?',
          [
            { text: '취소', style: 'cancel', onPress: () => resolve(false) },
            {
              text: '복원',
              onPress: async () => {
                const success = await this.performRestore(backupData);
                resolve(success);
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('[BackupService] 복원 실패:', error);
      Alert.alert('복원 실패', '백업 파일 복원 중 오류가 발생했습니다.');
      return false;
    }
  }

  /**
   * 실제 복원 수행
   */
  private async performRestore(backupData: BackupData): Promise<boolean> {
    try {
      const db = databaseService.getUserDb();
      if (!db) {
        throw new Error('데이터베이스가 초기화되지 않았습니다.');
      }

      const encryptionKey = await authService.getEncryptionKey();
      const now = new Date().toISOString();

      // 태그 복원
      for (const tag of backupData.tags || []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO memo_tags (tag_id, tag_name, color, created_at)
           VALUES (?, ?, ?, ?)`,
          [tag.tag_id, tag.tag_name, tag.color, tag.created_at || now]
        );
      }

      // 메모 복원 (암호화 적용)
      for (const memo of backupData.memos || []) {
        const encryptedContent = await encrypt(memo.content, encryptionKey);
        await db.runAsync(
          `INSERT OR REPLACE INTO memos
           (memo_id, verse_id, bible_id, book_id, chapter, verse_num, verse_start, verse_end, verse_range, content, tags, emotion_data, feedback_data, bible_text, is_encrypted, created_at, updated_at, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0)`,
          [
            memo.memo_id,
            memo.verse_id,
            memo.bible_id,
            memo.book_id,
            memo.chapter,
            memo.verse_num,
            memo.verse_start ?? null,
            memo.verse_end ?? null,
            memo.verse_range ?? null,
            encryptedContent,
            memo.tags,
            memo.emotion_data ?? null,
            memo.feedback_data ?? null,
            memo.bible_text ?? null,
            memo.created_at || now,
            memo.updated_at || now,
          ]
        );
      }

      // 메모-태그 매핑 복원
      for (const map of backupData.memo_tag_map || []) {
        await db.runAsync(
          `INSERT OR IGNORE INTO memo_tag_map (memo_id, tag_id) VALUES (?, ?)`,
          [map.memo_id, map.tag_id]
        );
      }

      // 북마크 복원
      for (const bookmark of backupData.bookmarks || []) {
        await db.runAsync(
          `INSERT OR REPLACE INTO bookmarks
           (bookmark_id, bible_id, book_id, chapter, verse_num, title, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            bookmark.bookmark_id,
            bookmark.bible_id,
            bookmark.book_id,
            bookmark.chapter,
            bookmark.verse_num,
            bookmark.title,
            bookmark.created_at || now,
          ]
        );
      }

      // 하이라이트 복원
      for (const highlight of backupData.highlights || []) {
        await db.runAsync(
          `INSERT OR REPLACE INTO highlights
           (highlight_id, verse_id, bible_id, book_id, chapter, verse_num, color, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            highlight.highlight_id,
            highlight.verse_id,
            highlight.bible_id,
            highlight.book_id,
            highlight.chapter,
            highlight.verse_num,
            highlight.color,
            highlight.created_at || now,
          ]
        );
      }

      Alert.alert('복원 완료', '백업 데이터가 성공적으로 복원되었습니다.');
      return true;
    } catch (error) {
      console.error('[BackupService] 복원 수행 실패:', error);
      Alert.alert('복원 실패', '데이터 복원 중 오류가 발생했습니다.');
      return false;
    }
  }

  /**
   * 현재 데이터 통계 조회
   */
  async getDataStats(): Promise<{
    memoCount: number;
    bookmarkCount: number;
    highlightCount: number;
    tagCount: number;
  }> {
    if (isWeb) {
      return { memoCount: 0, bookmarkCount: 0, highlightCount: 0, tagCount: 0 };
    }

    try {
      const db = databaseService.getUserDb();
      if (!db) {
        return { memoCount: 0, bookmarkCount: 0, highlightCount: 0, tagCount: 0 };
      }

      const memoResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM memos WHERE is_deleted = 0'
      );
      const bookmarkResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM bookmarks'
      );
      const highlightResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM highlights'
      );
      const tagResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM memo_tags'
      );

      return {
        memoCount: memoResult?.count || 0,
        bookmarkCount: bookmarkResult?.count || 0,
        highlightCount: highlightResult?.count || 0,
        tagCount: tagResult?.count || 0,
      };
    } catch {
      return { memoCount: 0, bookmarkCount: 0, highlightCount: 0, tagCount: 0 };
    }
  }
}

export const backupService = new BackupService();
