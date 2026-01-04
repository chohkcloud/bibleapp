import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MemoStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { EmptyState, CustomHeader } from '../../components/common';
import { memoService, bibleService } from '../../services';
import { useSettingsStore } from '../../store';
import type { Memo } from '../../types/database';

type Props = NativeStackScreenProps<MemoStackParamList, 'VerseHistory'>;

export function VerseHistoryScreen({ route, navigation }: Props) {
  const { verseId } = route.params;
  const { colors } = useTheme();
  const { bibleVersion, language } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [verseInfo, setVerseInfo] = useState<{
    bookName: string;
    chapter: number;
    verseNum: number;
    text: string;
  } | null>(null);

  // 구절 ID 파싱 (예: "1_1_1" -> bookId, chapter, verseNum)
  const parseVerseId = (id: string): { bookId: number; chapter: number; verseNum: number } | null => {
    const parts = id.split('_');
    if (parts.length >= 3) {
      return {
        bookId: parseInt(parts[0], 10),
        chapter: parseInt(parts[1], 10),
        verseNum: parseInt(parts[2], 10),
      };
    }
    return null;
  };

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      const parsed = parseVerseId(verseId);
      if (!parsed) {
        setIsLoading(false);
        return;
      }

      // 책 이름 로드
      const books = await bibleService.getBooks(language);
      const book = books.find((b) => b.book_id === parsed.bookId);

      // 구절 로드
      const verse = await bibleService.getVerse(
        bibleVersion,
        parsed.bookId,
        parsed.chapter,
        parsed.verseNum
      );

      if (verse) {
        setVerseInfo({
          bookName: book?.book_name || `${parsed.bookId}권`,
          chapter: parsed.chapter,
          verseNum: parsed.verseNum,
          text: verse.text,
        });
      }

      // 해당 구절의 메모 히스토리 로드
      const verseMemos = await memoService.getMemosByVerse(verseId);
      setMemos(verseMemos);
    } catch (error) {
      console.error('Error loading verse history:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [verseId, bibleVersion, language]);

  // 화면 포커스 시 새로고침
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 새로고침
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 메모 아이템 렌더링
  const renderMemoItem = ({ item, index }: { item: Memo; index: number }) => (
    <TouchableOpacity
      style={[styles.memoItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('MemoDetail', { memoId: item.id })}
    >
      <View style={styles.memoHeader}>
        <View style={[styles.indexBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.indexText, { color: colors.primary }]}>#{index + 1}</Text>
        </View>
        <Text style={[styles.memoDate, { color: colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <Text style={[styles.memoContent, { color: colors.text }]} numberOfLines={3}>
        {item.content}
      </Text>
      {item.tags && (
        <View style={styles.tagsRow}>
          {item.tags.split(',').slice(0, 3).map((tag, i) => (
            <View key={i} style={[styles.tagChip, { backgroundColor: colors.border }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                #{tag.trim()}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.memoFooter}>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['bottom']}>
        <CustomHeader title="구절 기록" />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['bottom']}>
      <CustomHeader title="구절 기록" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 구절 카드 */}
        {verseInfo && (
          <View style={[styles.verseCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.verseRef}>
              {verseInfo.bookName} {verseInfo.chapter}:{verseInfo.verseNum}
            </Text>
            <Text style={styles.verseText} numberOfLines={3}>
              {verseInfo.text}
            </Text>
          </View>
        )}

        {/* 통계 */}
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            총 {memos.length}개의 묵상 기록
          </Text>
        </View>

        {/* 메모 목록 */}
        {memos.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="기록 없음"
            message="이 구절에 대한 묵상 기록이 없습니다"
          />
        ) : (
          <FlatList
            data={memos}
            keyExtractor={(item) => item.id}
            renderItem={renderMemoItem}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  verseRef: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },
  statsRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  memoItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  memoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indexBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memoDate: {
    fontSize: 13,
  },
  memoContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
  },
  memoFooter: {
    alignItems: 'flex-end',
  },
});
