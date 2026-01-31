import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MemoStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useSettingsStore } from '../../store';
import { analyticsService, bibleService } from '../../services';

interface Summary {
  totalMemos: number;
  thisWeekMemos: number;
  thisMonthMemos: number;
  streakDays: number;
}

interface TopVerse {
  bookId: number;
  chapter: number;
  verseNum: number;
  count: number;
  bookName: string;
}

interface DayStat {
  date: string;
  count: number;
  dayName: string;
}

interface BookStat {
  bookId: number;
  bookName: string;
  count: number;
}

type Props = NativeStackScreenProps<MemoStackParamList, 'Analytics'>;

export function AnalyticsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { language } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState<Summary>({
    totalMemos: 0,
    thisWeekMemos: 0,
    thisMonthMemos: 0,
    streakDays: 0,
  });
  const [topVerses, setTopVerses] = useState<TopVerse[]>([]);
  const [dailyStats, setDailyStats] = useState<DayStat[]>([]);
  const [bookStats, setBookStats] = useState<BookStat[]>([]);
  const [mostActiveDay, setMostActiveDay] = useState<string>('');

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      // 책 이름 로드
      const books = await bibleService.getBooks(language);
      const bookNames: Record<number, string> = {};
      books.forEach((book) => {
        bookNames[book.book_id] = book.book_name;
      });

      // 요약 통계
      const summaryData = await analyticsService.getSummary();
      setSummary(summaryData);

      // TOP 구절
      const topVersesData = await analyticsService.getTopVerses(language, 5);
      setTopVerses(
        topVersesData.map((v) => ({
          bookId: v.book_id,
          chapter: v.chapter,
          verseNum: v.verse_num,
          count: v.memo_count,
          bookName: bookNames[v.book_id] || v.book_name || `${v.book_id}권`,
        }))
      );

      // 일별 통계 (최근 7일)
      const dailyData = await analyticsService.getDailyStats(7);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      setDailyStats(
        dailyData.map((d) => ({
          ...d,
          dayName: dayNames[new Date(d.date).getDay()],
        }))
      );

      // 책별 통계
      const bookData = await analyticsService.getBookStats(language);
      setBookStats(bookData.slice(0, 5));

      // 가장 활발한 요일
      const activeDay = await analyticsService.getMostActiveDay();
      const dayKorean: Record<number, string> = {
        0: '일요일',
        1: '월요일',
        2: '화요일',
        3: '수요일',
        4: '목요일',
        5: '금요일',
        6: '토요일',
      };
      setMostActiveDay(activeDay !== null ? dayKorean[activeDay.dayOfWeek] : '');
    } catch (error) {
      console.error('Error loading analytics:', error);
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

  // 최대값 찾기 (차트용)
  const maxDailyCount = Math.max(...dailyStats.map((d) => d.count), 1);

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['top', 'bottom']}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              통계를 불러오는 중...
            </Text>
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>묵상 통계</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 요약 바 (한 줄 콤팩트) */}
        <View style={[styles.compactStatsBar, { backgroundColor: colors.surface }]}>
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: colors.primary }]}>{summary.totalMemos}</Text>
            <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>총묵상</Text>
          </View>
          <View style={[styles.compactStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: colors.primary }]}>{summary.streakDays}</Text>
            <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>연속일</Text>
          </View>
          <View style={[styles.compactStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: colors.primary }]}>{summary.thisWeekMemos}</Text>
            <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>이번주</Text>
          </View>
          <View style={[styles.compactStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.compactStatItem}>
            <Text style={[styles.compactStatValue, { color: colors.primary }]}>{summary.thisMonthMemos}</Text>
            <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>이번달</Text>
          </View>
        </View>

        {/* 주간 활동 그래프 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            주간 활동
          </Text>
          <View style={styles.chartContainer}>
            {dailyStats.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(day.count / maxDailyCount) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {day.dayName}
                </Text>
                <Text style={[styles.barValue, { color: colors.text }]}>
                  {day.count}
                </Text>
              </View>
            ))}
          </View>
          {mostActiveDay && (
            <Text style={[styles.chartNote, { color: colors.textSecondary }]}>
              가장 활발한 요일: {mostActiveDay}
            </Text>
          )}
        </View>

        {/* TOP 묵상 구절 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            자주 묵상한 구절
          </Text>
          {topVerses.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              아직 묵상 기록이 없습니다
            </Text>
          ) : (
            topVerses.map((verse, index) => (
              <View
                key={index}
                style={[styles.listItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.listRank}>
                  <Text style={[styles.rankText, { color: colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.listContent}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>
                    {verse.bookName} {verse.chapter}:{verse.verseNum}
                  </Text>
                  <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>
                    {verse.count}회 묵상
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 책별 통계 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            책별 묵상 현황
          </Text>
          {bookStats.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              아직 묵상 기록이 없습니다
            </Text>
          ) : (
            bookStats.map((book, index) => (
              <View
                key={index}
                style={[styles.bookStatItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.bookName, { color: colors.text }]}>
                  {book.bookName}
                </Text>
                <View style={styles.bookBarContainer}>
                  <View
                    style={[
                      styles.bookBar,
                      {
                        width: `${(book.count / bookStats[0].count) * 100}%`,
                        backgroundColor: colors.primary + '40',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.bookCount, { color: colors.primary }]}>
                  {book.count}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* 동기부여 카드 */}
        {summary.streakDays > 0 && (
          <View style={[styles.motivationCard, { backgroundColor: colors.primary + '20' }]}>
            <Text style={styles.motivationEmoji}>
              {summary.streakDays >= 7 ? '🔥' : summary.streakDays >= 3 ? '⭐' : '✨'}
            </Text>
            <Text style={[styles.motivationTitle, { color: colors.primary }]}>
              {summary.streakDays >= 7
                ? '대단해요!'
                : summary.streakDays >= 3
                ? '잘하고 있어요!'
                : '좋은 시작이에요!'}
            </Text>
            <Text style={[styles.motivationText, { color: colors.text }]}>
              {summary.streakDays}일 연속 묵상 중입니다.{'\n'}
              꾸준한 말씀 묵상이 삶을 변화시킵니다.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
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
  compactStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  compactStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  compactStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  compactStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  compactStatDivider: {
    width: 1,
    height: 28,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 140,
    paddingBottom: 30,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: 20,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  listSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  bookStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bookName: {
    width: 80,
    fontSize: 14,
  },
  bookBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 12,
  },
  bookBar: {
    height: '100%',
    borderRadius: 4,
  },
  bookCount: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  motivationCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  motivationEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 40,
  },
});
