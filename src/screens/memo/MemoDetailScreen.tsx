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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MemoStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { LinkedText, VersePopup } from '../../components/memo';
import { useSettingsStore } from '../../store';
import { memoService, bibleService, chocoService } from '../../services';
import type { HybridEmotionResult } from '../../services/chocoService';
import type { Memo, Verse } from '../../types/database';
import type { ParsedBibleRef } from '../../utils/bibleRefParser';

type Props = NativeStackScreenProps<MemoStackParamList, 'MemoDetail'>;

export function MemoDetailScreen({ route, navigation }: Props) {
  const { memoId } = route.params;
  const { colors } = useTheme();
  const { bibleVersion, language } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [bookName, setBookName] = useState('');
  const [emotionResult, setEmotionResult] = useState<HybridEmotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // 성경 참조 팝업 상태
  const [showVersePopup, setShowVersePopup] = useState(false);
  const [selectedRef, setSelectedRef] = useState<ParsedBibleRef | null>(null);

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

      // 감정분석 실행 (비동기)
      analyzeEmotion(memoData.content);
    } catch (error) {
      console.error('Error loading memo:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [memoId, bibleVersion, language, navigation]);

  // 감정분석 실행
  const analyzeEmotion = useCallback(async (content: string) => {
    if (!content || content.trim().length < 10) {
      return; // 내용이 너무 짧으면 분석하지 않음
    }

    try {
      setIsAnalyzing(true);
      const result = await chocoService.analyzeHybridEmotion(content);
      setEmotionResult(result);
    } catch (error) {
      console.log('[MemoDetail] 감정분석 실패:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

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

  // 성경 참조 클릭 핸들러
  const handleRefPress = (ref: ParsedBibleRef) => {
    setSelectedRef(ref);
    setShowVersePopup(true);
  };

  // 팝업에서 구절로 이동
  const handleGoToRefVerse = () => {
    if (!selectedRef) return;
    setShowVersePopup(false);
    navigation.navigate('BibleTab' as any, {
      screen: 'Reading',
      params: {
        bookId: selectedRef.bookId,
        chapter: selectedRef.chapter,
      },
    });
  };

  // 구절 범위 표시 문자열 생성
  const getVerseRangeDisplay = () => {
    if (!memo) return '';
    if (memo.verse_range) {
      return `${bookName} ${memo.chapter}:${memo.verse_range}`;
    }
    return `${bookName} ${memo.chapter}:${memo.verse_num}`;
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


  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['top', 'bottom']}>
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
      <SafeContainer edges={['top', 'bottom']}>
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
    <SafeContainer edges={['top', 'bottom']}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>묵상 상세</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerActionButton}>
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={styles.headerActionButton}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerActionButton}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

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
            {getVerseRangeDisplay()}
          </Text>
          {verse && (
            <Text style={styles.verseText} numberOfLines={4}>
              {verse.text}
            </Text>
          )}
          <Text style={styles.goToVerseText}>말씀 보기 →</Text>
        </TouchableOpacity>

        {/* 묵상 내용 - 성경 참조 링크 지원 */}
        <View style={[styles.contentCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.contentLabel, { color: colors.textSecondary }]}>
            묵상 내용
          </Text>
          <LinkedText
            text={memo.content}
            style={[styles.contentText, { color: colors.text }]}
            onRefPress={handleRefPress}
          />
        </View>

        {/* 감정분석 결과 */}
        <View style={[styles.emotionCard, { backgroundColor: colors.surface }]}>
          {/* 헤더 */}
          <View style={styles.emotionHeader}>
            <View style={styles.emotionHeaderLeft}>
              <Text style={styles.emotionHeaderIcon}>🤖</Text>
              <Text style={[styles.emotionLabel, { color: colors.text }]}>
                AI 감정분석
              </Text>
            </View>
            {emotionResult && (
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Text style={[styles.confidenceText, { color: colors.primary }]}>
                  신뢰도 {Math.round(emotionResult.confidence * 100)}%
                </Text>
              </View>
            )}
          </View>

          {isAnalyzing ? (
            /* 분석 중 상태 */
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.analyzingText, { color: colors.textSecondary }]}>
                묵상 내용을 분석하고 있습니다...
              </Text>
              <Text style={[styles.analyzingSubText, { color: colors.textSecondary }]}>
                한국어 감정 데이터베이스를 참조 중
              </Text>
            </View>
          ) : emotionResult ? (
            <>
              {/* 주요 감정 - 큰 디스플레이 */}
              <View
                style={[
                  styles.mainEmotionContainer,
                  { backgroundColor: chocoService.getEmotionColor(emotionResult.main_emotion) + '15' },
                ]}
              >
                <Text style={styles.mainEmotionIcon}>
                  {chocoService.getEmotionIcon(emotionResult.main_emotion)}
                </Text>
                <Text
                  style={[
                    styles.mainEmotionText,
                    { color: chocoService.getEmotionColor(emotionResult.main_emotion) },
                  ]}
                >
                  {emotionResult.main_emotion}
                </Text>
              </View>

              {/* 분위기 설명 */}
              {emotionResult.tone && (
                <View style={[styles.toneContainer, { borderColor: colors.border }]}>
                  <Text style={styles.toneIcon}>💭</Text>
                  <Text style={[styles.toneText, { color: colors.text }]}>
                    "{emotionResult.tone}"
                  </Text>
                </View>
              )}

              {/* 감정 태그들 */}
              {emotionResult.emotions.length > 0 && (
                <View style={styles.emotionTagsSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    감지된 감정
                  </Text>
                  <View style={styles.emotionTagsRow}>
                    {emotionResult.emotions.slice(0, 5).map((emotion, index) => (
                      <View
                        key={index}
                        style={[
                          styles.emotionTag,
                          {
                            backgroundColor: chocoService.getEmotionColor(emotion) + '20',
                            borderColor: chocoService.getEmotionColor(emotion) + '40',
                          },
                        ]}
                      >
                        <Text style={styles.emotionTagIcon}>
                          {chocoService.getEmotionIcon(emotion)}
                        </Text>
                        <Text
                          style={[
                            styles.emotionTagText,
                            { color: chocoService.getEmotionColor(emotion) },
                          ]}
                        >
                          {emotion}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 핵심 표현 */}
              {emotionResult.key_phrases && emotionResult.key_phrases.length > 0 && (
                <View style={styles.keyPhrasesSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    핵심 표현
                  </Text>
                  <View style={styles.keyPhrasesRow}>
                    {emotionResult.key_phrases.slice(0, 4).map((phrase, index) => (
                      <View
                        key={index}
                        style={[
                          styles.keyPhraseChip,
                          { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.keyPhraseText, { color: colors.text }]}>
                          "{phrase}"
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* RAG 컨텍스트 정보 */}
              <View style={[styles.ragInfoContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.ragInfoLabel, { color: colors.textSecondary }]}>
                  분석에 사용된 한국어 감정 데이터
                </Text>
                <View style={styles.ragInfoRow}>
                  <View style={styles.ragInfoItem}>
                    <Text style={[styles.ragInfoCount, { color: colors.primary }]}>
                      {emotionResult.context.kpoem}
                    </Text>
                    <Text style={[styles.ragInfoName, { color: colors.textSecondary }]}>
                      KPoEM
                    </Text>
                  </View>
                  <View style={[styles.ragInfoDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.ragInfoItem}>
                    <Text style={[styles.ragInfoCount, { color: colors.primary }]}>
                      {emotionResult.context.kote}
                    </Text>
                    <Text style={[styles.ragInfoName, { color: colors.textSecondary }]}>
                      KOTE
                    </Text>
                  </View>
                  <View style={[styles.ragInfoDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.ragInfoItem}>
                    <Text style={[styles.ragInfoCount, { color: colors.primary }]}>
                      {emotionResult.context.kosac}
                    </Text>
                    <Text style={[styles.ragInfoName, { color: colors.textSecondary }]}>
                      KOSAC
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* 분석 전 상태 */
            <View style={styles.beforeAnalyzeContainer}>
              <Text style={styles.beforeAnalyzeIcon}>🔍</Text>
              <Text style={[styles.beforeAnalyzeText, { color: colors.textSecondary }]}>
                묵상 내용의 감정을 AI가 분석해 드립니다
              </Text>
              <TouchableOpacity
                style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                onPress={() => analyzeEmotion(memo.content)}
              >
                <Text style={styles.analyzeButtonText}>
                  감정분석 시작하기
                </Text>
              </TouchableOpacity>
            </View>
          )}
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

      {/* 성경 참조 팝업 */}
      <VersePopup
        visible={showVersePopup}
        reference={selectedRef}
        onClose={() => setShowVersePopup(false)}
        onGoToVerse={handleGoToRefVerse}
      />
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
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
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
  // 감정분석 스타일
  emotionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emotionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionHeaderIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // 분석 중 상태
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  analyzingText: {
    fontSize: 15,
    marginTop: 16,
    fontWeight: '500',
  },
  analyzingSubText: {
    fontSize: 12,
    marginTop: 4,
  },
  // 주요 감정
  mainEmotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  mainEmotionIcon: {
    fontSize: 48,
    marginRight: 12,
  },
  mainEmotionText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  // 분위기
  toneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  toneIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  toneText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontStyle: 'italic',
  },
  // 섹션
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // 감정 태그
  emotionTagsSection: {
    marginBottom: 16,
  },
  emotionTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  emotionTagIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  emotionTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // 핵심 표현
  keyPhrasesSection: {
    marginBottom: 16,
  },
  keyPhrasesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keyPhraseChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  keyPhraseText: {
    fontSize: 13,
  },
  // RAG 정보
  ragInfoContainer: {
    padding: 12,
    borderRadius: 12,
  },
  ragInfoLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
  ragInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ragInfoItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  ragInfoCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ragInfoName: {
    fontSize: 11,
    marginTop: 2,
  },
  ragInfoDivider: {
    width: 1,
    height: 30,
  },
  // 분석 전 상태
  beforeAnalyzeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  beforeAnalyzeIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  beforeAnalyzeText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  analyzeButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
