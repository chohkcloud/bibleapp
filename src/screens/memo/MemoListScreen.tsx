import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MemoStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { CustomHeader } from '../../components/common';
import { useSettingsStore } from '../../store';
import { memoService, bibleService } from '../../services';
import type { Memo } from '../../types/database';

type Props = NativeStackScreenProps<MemoStackParamList, 'MemoList'>;

type FilterType = 'all' | 'recent' | 'bookmarked';

export function MemoListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { language } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [bookNames, setBookNames] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<FilterType>('all');

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      // 책 이름 로드
      const books = await bibleService.getBooks(language);
      const names: Record<number, string> = {};
      books.forEach((book) => {
        names[book.book_id] = book.book_name;
      });
      setBookNames(names);

      // 메모 목록 로드
      const memoList = await memoService.getMemos(undefined, 100, 0);
      setMemos(memoList);
    } catch (error) {
      console.error('Error loading memos:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [language]);

  // 화면 포커스될 때마다 새로고침
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

  // 메모 클릭
  const handleMemoPress = (memoId: string) => {
    navigation.navigate('MemoDetail', { memoId });
  };

  // 메모 삭제
  const handleDeleteMemo = (memoId: string) => {
    Alert.alert(
      '메모 삭제',
      '이 메모를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await memoService.deleteMemo(memoId);
              loadData();
            } catch (error) {
              console.error('Error deleting memo:', error);
              Alert.alert('오류', '메모 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 통계 화면으로
  const handleGoToAnalytics = () => {
    navigation.navigate('Analytics');
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // 메모 렌더링
  const renderMemo = ({ item }: { item: Memo }) => (
    <TouchableOpacity
      style={[styles.memoItem, { backgroundColor: colors.surface }]}
      onPress={() => handleMemoPress(item.memo_id)}
      onLongPress={() => handleDeleteMemo(item.memo_id)}
    >
      <View style={styles.memoHeader}>
        <Text style={[styles.memoReference, { color: colors.primary }]}>
          {bookNames[item.book_id] || `${item.book_id}권`} {item.chapter}:{item.verse_num}
        </Text>
        <Text style={[styles.memoDate, { color: colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <Text
        style={[styles.memoContent, { color: colors.text }]}
        numberOfLines={3}
      >
        {item.content}
      </Text>
      {item.tags && (
        <View style={styles.memoTags}>
          {item.tags.split(',').slice(0, 3).map((tag, index) => (
            <View
              key={index}
              style={[styles.tagChip, { backgroundColor: colors.primary + '20' }]}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>
                #{tag.trim()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  // 빈 상태 렌더링
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        메모가 없습니다
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        성경을 읽으며 묵상 메모를 작성해보세요.{'\n'}
        말씀을 통한 깨달음을 기록할 수 있습니다.
      </Text>
    </View>
  );

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['bottom']}>
        <CustomHeader title="메모" showBackButton={false} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              메모를 불러오는 중...
            </Text>
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['bottom']}>
      <CustomHeader title="메모" showBackButton={false} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 헤더 액션 */}
        <View style={[styles.filterHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'all' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === 'all' ? '#FFFFFF' : colors.text },
                ]}
              >
                전체
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'recent' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFilter('recent')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === 'recent' ? '#FFFFFF' : colors.text },
                ]}
              >
                최근
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.analyticsButton, { borderColor: colors.primary }]}
            onPress={handleGoToAnalytics}
          >
            <Text style={[styles.analyticsButtonText, { color: colors.primary }]}>
              통계
            </Text>
          </TouchableOpacity>
        </View>

        {/* 메모 개수 */}
        <View style={styles.countContainer}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            총 {memos.length}개의 묵상
          </Text>
        </View>

        {/* 메모 목록 */}
        <FlatList
          data={memos}
          renderItem={renderMemo}
          keyExtractor={(item) => item.memo_id}
          contentContainerStyle={[
            styles.listContent,
            memos.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  analyticsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  analyticsButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listEmpty: {
    flex: 1,
  },
  memoItem: {
    padding: 16,
    borderRadius: 12,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoReference: {
    fontSize: 14,
    fontWeight: '600',
  },
  memoDate: {
    fontSize: 12,
  },
  memoContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  memoTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
