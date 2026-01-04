import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MemoStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { CustomHeader } from '../../components/common';
import { useSettingsStore } from '../../store';
import { memoService, bibleService } from '../../services';
import type { Memo, Verse } from '../../types/database';

type Props = NativeStackScreenProps<MemoStackParamList, 'MemoDetail'>;

export function MemoDetailScreen({ route, navigation }: Props) {
  const { memoId } = route.params;
  const { colors } = useTheme();
  const { bibleVersion, language } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [bookName, setBookName] = useState('');

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 메모 로드
      const memoData = await memoService.getMemo(memoId);
      if (!memoData) {
        Alert.alert('오류', '메모를 찾을 수 없습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      setMemo(memoData);

      // 책 이름 로드
      const books = await bibleService.getBooks(language);
      const book = books.find((b) => b.book_id === memoData.book_id);
      setBookName(book?.book_name || `${memoData.book_id}권`);

      // 구절 로드
      const verseData = await bibleService.getVerse(
        bibleVersion,
        memoData.book_id,
        memoData.chapter,
        memoData.verse_num
      );
      setVerse(verseData);
    } catch (error) {
      console.error('Error loading memo:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [memoId, bibleVersion, language, navigation]);

  // 화면 포커스될 때마다 새로고침
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 수정
  const handleEdit = () => {
    navigation.navigate('MemoEdit', { memoId });
  };

  // 삭제
  const handleDelete = () => {
    Alert.alert(
      '묵상 삭제',
      '이 묵상을 삭제하시겠습니까?\n삭제된 묵상은 복구할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await memoService.deleteMemo(memoId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting memo:', error);
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 공유
  const handleShare = async () => {
    if (!memo || !verse) return;

    try {
      const shareText = `📖 ${bookName} ${memo.chapter}:${memo.verse_num}\n\n"${verse.text}"\n\n📝 묵상:\n${memo.content}\n\n- BibleApp`;

      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // 해당 구절로 이동
  const handleGoToVerse = () => {
    if (!memo) return;
    navigation.navigate('BibleTab' as any, {
      screen: 'Reading',
      params: {
        bookId: memo.book_id,
        chapter: memo.chapter,
      },
    });
  };

  // 구절 히스토리 보기
  const handleViewHistory = () => {
    if (!verse) return;
    navigation.navigate('VerseHistory', { verseId: String(verse.verse_id) });
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 헤더 오른쪽 버튼 컴포넌트
  const headerRightComponent = (
    <View style={styles.headerButtons}>
      <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
        <Text style={{ color: colors.primary, fontSize: 14 }}>공유</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
        <Text style={{ color: colors.primary, fontSize: 14 }}>수정</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
        <Text style={{ color: colors.error, fontSize: 14 }}>삭제</Text>
      </TouchableOpacity>
    </View>
  );

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['bottom']}>
        <CustomHeader title="메모 상세" />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </SafeContainer>
    );
  }

  // 메모 없음
  if (!memo) {
    return (
      <SafeContainer edges={['bottom']}>
        <CustomHeader title="메모 상세" />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              메모를 찾을 수 없습니다.
            </Text>
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['bottom']}>
      <CustomHeader title="메모 상세" rightComponent={headerRightComponent} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 구절 카드 */}
        <TouchableOpacity
          style={[styles.verseCard, { backgroundColor: colors.primary }]}
          onPress={handleGoToVerse}
        >
          <Text style={styles.verseLabel}>📖 관련 구절</Text>
          <Text style={styles.verseReference}>
            {bookName} {memo.chapter}:{memo.verse_num}
          </Text>
          {verse && (
            <Text style={styles.verseText} numberOfLines={4}>
              {verse.text}
            </Text>
          )}
          <Text style={styles.goToVerseText}>말씀 보기 →</Text>
        </TouchableOpacity>

        {/* 묵상 내용 */}
        <View style={[styles.contentCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.contentLabel, { color: colors.textSecondary }]}>
            묵상 내용
          </Text>
          <Text style={[styles.contentText, { color: colors.text }]}>
            {memo.content}
          </Text>
        </View>

        {/* 태그 */}
        {memo.tags && (
          <View style={styles.tagsContainer}>
            <Text style={[styles.tagsLabel, { color: colors.textSecondary }]}>
              태그
            </Text>
            <View style={styles.tagsRow}>
              {memo.tags.split(',').map((tag, index) => (
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
          </View>
        )}

        {/* 메타 정보 */}
        <View style={[styles.metaCard, { backgroundColor: colors.surface }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              작성일
            </Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {formatDate(memo.created_at)}
            </Text>
          </View>
          {memo.updated_at !== memo.created_at && (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                수정일
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {formatDate(memo.updated_at)}
              </Text>
            </View>
          )}
        </View>

        {/* 추가 액션 */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={handleViewHistory}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              📊 이 구절의 묵상 히스토리 보기
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 4,
    marginLeft: 12,
  },
  verseCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  verseLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  verseReference: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  goToVerseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  contentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  contentLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
  },
  tagsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  metaCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
  },
  metaValue: {
    fontSize: 14,
  },
  actionsContainer: {
    marginHorizontal: 16,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});
