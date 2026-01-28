import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useBibleStore, useSettingsStore } from '../../store';
import { analyticsService, memoService, bibleService } from '../../services';
import type { Memo, Verse } from '../../types/database';

interface TodayVerse {
  verse: Verse | null;
  bookName: string;
}

interface Stats {
  totalMemos: number;
  thisWeekMemos: number;
  thisMonthMemos: number;
  streakDays: number;
}

export function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { currentBook, currentChapter, setCurrentBook, setCurrentChapter } = useBibleStore();
  const { language } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todayVerse, setTodayVerse] = useState<TodayVerse>({ verse: null, bookName: '' });
  const [stats, setStats] = useState<Stats>({
    totalMemos: 0,
    thisWeekMemos: 0,
    thisMonthMemos: 0,
    streakDays: 0,
  });
  const [recentMemos, setRecentMemos] = useState<Memo[]>([]);
  const [bookNames, setBookNames] = useState<Record<number, string>>({});

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      // 통계 로드
      const summary = await analyticsService.getSummary();
      setStats({
        totalMemos: summary.totalMemos,
        thisWeekMemos: summary.thisWeekMemos,
        thisMonthMemos: summary.thisMonthMemos,
        streakDays: summary.streakDays,
      });

      // 최근 메모 로드
      const memos = await memoService.getMemos(undefined, 5, 0);
      setRecentMemos(memos);

      // 책 이름 로드
      const books = await bibleService.getBooks(language);
      const names: Record<number, string> = {};
      books.forEach((book) => {
        names[book.book_id] = book.book_name;
      });
      setBookNames(names);

      // 오늘의 말씀 (간단히 요한복음 3:16 고정)
      const verse = await bibleService.getVerse('KRV', 43, 3, 16);
      if (verse) {
        setTodayVerse({
          verse,
          bookName: names[43] || '요한복음',
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [language]);

  // 화면 포커스될 때마다 데이터 새로고침
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

  // 오늘의 말씀 읽기
  const handleReadTodayVerse = () => {
    if (todayVerse.verse) {
      navigation.navigate('BibleTab', {
        screen: 'Reading',
        params: {
          bookId: todayVerse.verse.book_id,
          chapter: todayVerse.verse.chapter,
        },
      });
    }
  };

  // 이어서 읽기
  const handleContinueReading = () => {
    navigation.navigate('BibleTab', {
      screen: 'Reading',
      params: {
        bookId: currentBook,
        chapter: currentChapter,
      },
    });
  };

  // 메모 상세 보기
  const handleMemoPress = (memoId: string) => {
    navigation.navigate('MemoTab', {
      screen: 'MemoDetail',
      params: { memoId },
    });
  };

  // 통계 보기
  const handleViewStats = () => {
    navigation.navigate('MemoTab', {
      screen: 'Analytics',
    });
  };

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

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 인사말 */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            안녕하세요!
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </View>

        {/* 오늘의 말씀 */}
        {todayVerse.verse && (
          <View style={[styles.card, styles.todayCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.todayLabel}>오늘의 말씀</Text>
            <Text style={styles.todayReference}>
              {todayVerse.bookName} {todayVerse.verse.chapter}:{todayVerse.verse.verse_num}
            </Text>
            <Text style={styles.todayText} numberOfLines={4}>
              {todayVerse.verse.text}
            </Text>
            <View style={styles.todayButtons}>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={handleReadTodayVerse}
              >
                <Text style={styles.todayButtonText}>읽기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.todayButton, styles.todayButtonOutline]}
                onPress={() => {
                  if (todayVerse.verse) {
                    navigation.navigate('MemoTab', {
                      screen: 'MemoEdit',
                      params: { verseId: todayVerse.verse.verse_id },
                    });
                  }
                }}
              >
                <Text style={styles.todayButtonTextOutline}>묵상하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 통계 카드 */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={handleViewStats}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              나의 묵상 현황
            </Text>
            <Text style={[styles.cardLink, { color: colors.primary }]}>
              자세히 보기 &gt;
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {stats.thisWeekMemos}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                이번 주
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {stats.thisMonthMemos}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                이번 달
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {stats.streakDays}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                연속 일수
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 이어서 읽기 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            최근 읽은 곳
          </Text>
          <Text style={[styles.cardContent, { color: colors.textSecondary }]}>
            {bookNames[currentBook] || `${currentBook}권`} {currentChapter}장
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinueReading}
          >
            <Text style={styles.continueButtonText}>이어서 읽기</Text>
          </TouchableOpacity>
        </View>

        {/* 최근 메모 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              최근 묵상
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MemoTab', { screen: 'MemoList' })}
            >
              <Text style={[styles.cardLink, { color: colors.primary }]}>
                전체 보기 &gt;
              </Text>
            </TouchableOpacity>
          </View>

          {recentMemos.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              아직 작성한 묵상이 없습니다.{'\n'}
              오늘의 말씀으로 첫 묵상을 시작해보세요!
            </Text>
          ) : (
            recentMemos.map((memo) => (
              <TouchableOpacity
                key={memo.memo_id}
                style={[styles.memoItem, { borderBottomColor: colors.border }]}
                onPress={() => handleMemoPress(memo.memo_id)}
              >
                <View style={styles.memoHeader}>
                  <Text style={[styles.memoReference, { color: colors.text }]}>
                    {bookNames[memo.book_id] || `${memo.book_id}권`} {memo.chapter}:{memo.verse_num}
                  </Text>
                  <Text style={[styles.memoDate, { color: colors.textSecondary }]}>
                    {formatDate(memo.created_at)}
                  </Text>
                </View>
                <Text
                  style={[styles.memoContent, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {memo.content}
                </Text>
                {memo.tags && (
                  <View style={styles.memoTags}>
                    {memo.tags.split(',').slice(0, 3).map((tag, index) => (
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
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  greetingSection: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  todayCard: {
    paddingVertical: 20,
  },
  todayLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 4,
  },
  todayReference: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  todayText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 16,
  },
  todayButtons: {
    flexDirection: 'row',
  },
  todayButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  todayButtonOutline: {
    backgroundColor: '#FFFFFF',
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  todayButtonTextOutline: {
    color: '#2563EB',
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardLink: {
    fontSize: 14,
  },
  cardContent: {
    fontSize: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  continueButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingVertical: 16,
  },
  memoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  memoReference: {
    fontSize: 15,
    fontWeight: '600',
  },
  memoDate: {
    fontSize: 12,
  },
  memoContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  memoTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
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
  bottomSpacing: {
    height: 20,
  },
});
