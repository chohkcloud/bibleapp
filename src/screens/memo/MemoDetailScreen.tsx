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
import { Linking } from 'react-native';
import { memoService, bibleService, chocoService } from '../../services';
import type { HybridEmotionResult, MeditationFeedbackResult } from '../../services/chocoService';
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
  const [fullVerseText, setFullVerseText] = useState<string>('');
  const [bookName, setBookName] = useState('');
  const [emotionResult, setEmotionResult] = useState<HybridEmotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // 묵상 피드백 상태
  const [feedbackResult, setFeedbackResult] = useState<MeditationFeedbackResult | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  // 히스토리 상태
  const [showEmotionHistory, setShowEmotionHistory] = useState(false);
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState<Array<{ history_id: string; result_data: string; created_at: string }>>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<Array<{ history_id: string; result_data: string; created_at: string }>>([]);
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

      // 구절 로드 (범위 묵상인 경우 전체 구절 텍스트 합침)
      const verseData = await bibleService.getVerse(
        bibleVersion,
        memoData.book_id,
        memoData.chapter,
        memoData.verse_num
      );
      setVerse(verseData);

      // 범위 구절이면 전체 텍스트 합침 (피드백 API용)
      if (memoData.verse_range && memoData.verse_start && memoData.verse_end) {
        const verseTexts: string[] = [];
        for (let vn = memoData.verse_start; vn <= memoData.verse_end; vn++) {
          const v = await bibleService.getVerse(bibleVersion, memoData.book_id, memoData.chapter, vn);
          if (v) verseTexts.push(v.text);
        }
        setFullVerseText(verseTexts.join(' '));
      } else if (verseData) {
        setFullVerseText(verseData.text);
      }

      // 저장된 감정분석 결과 로드 (API 호출 안함)
      if (memoData.emotion_data) {
        try {
          const parsed = JSON.parse(memoData.emotion_data);
          setEmotionResult(parsed);
        } catch { /* 파싱 실패 무시 */ }
      }

      // 저장된 묵상 피드백 결과 로드
      if (memoData.feedback_data) {
        try {
          const parsed = JSON.parse(memoData.feedback_data);
          setFeedbackResult(parsed);
        } catch { /* 파싱 실패 무시 */ }
      }
    } catch (error) {
      console.error('Error loading memo:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [memoId, bibleVersion, language, navigation]);

  // 감정분석 실행 (신규 또는 재분석)
  const runEmotionAnalysis = useCallback(async () => {
    if (!memo) return;
    try {
      setIsAnalyzing(true);
      const result = await chocoService.analyzeHybridEmotion(memo.content);
      if (result) {
        setEmotionResult(result);
        const json = JSON.stringify(result);
        await memoService.saveEmotionData(memo.memo_id, json);
      }
    } catch (error) {
      console.log('[MemoDetail] 감정분석 실패:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [memo]);

  // 감정분석 재요청 (경고 표시)
  const handleReAnalyzeEmotion = () => {
    if (emotionResult) {
      Alert.alert(
        '재분석 확인',
        '기존 감정분석 결과가 새 결과로 대체됩니다.\n기존 결과는 히스토리에서 확인 가능합니다.\n\n계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '재분석', onPress: runEmotionAnalysis },
        ]
      );
    } else {
      runEmotionAnalysis();
    }
  };

  // 묵상 AI 피드백 요청
  const runFeedback = useCallback(async () => {
    if (!memo) return;
    setIsFeedbackLoading(true);
    setFeedbackError(null);
    try {
      // bible_text: 범위 구절이면 합쳐진 전체 텍스트, 아니면 단일 구절
      const bibleText = fullVerseText || verse?.text || '';
      if (!bibleText) {
        setFeedbackError('성경 본문을 불러올 수 없습니다. 성경 버전을 확인해주세요.');
        return;
      }
      const result = await chocoService.forceMeditationFeedback({
        bible_text: bibleText,
        bible_ref: getVerseRangeDisplay(),
        meditation_text: memo.content,
      });
      if (result.error) {
        setFeedbackError(result.error);
      } else if (result.data) {
        setFeedbackResult(result.data);
        const json = JSON.stringify(result.data);
        await memoService.saveFeedbackData(memo.memo_id, json);
      }
    } catch {
      setFeedbackError('피드백 요청 중 오류가 발생했습니다.');
    } finally {
      setIsFeedbackLoading(false);
    }
  }, [memo, verse, fullVerseText, bookName]);

  // 묵상 피드백 재요청 (경고 표시)
  const handleReRequestFeedback = () => {
    if (feedbackResult) {
      Alert.alert(
        '재요청 확인',
        '기존 묵상 피드백이 새 결과로 대체됩니다.\n기존 결과는 히스토리에서 확인 가능합니다.\n\n계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '재요청', onPress: runFeedback },
        ]
      );
    } else {
      runFeedback();
    }
  };

  // 감정분석 히스토리 보기
  const handleShowEmotionHistory = async () => {
    if (!memo) return;
    const history = await memoService.getAIAnalysisHistory(memo.memo_id, 'emotion');
    setEmotionHistory(history);
    setShowEmotionHistory(true);
  };

  // 피드백 히스토리 보기
  const handleShowFeedbackHistory = async () => {
    if (!memo) return;
    const history = await memoService.getAIAnalysisHistory(memo.memo_id, 'feedback');
    setFeedbackHistory(history);
    setShowFeedbackHistory(true);
  };

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

  // 공유 텍스트 생성
  const buildShareText = () => {
    if (!memo) return '';
    const verseRef = getVerseRangeDisplay();
    const verseBody = verse ? `\n\n"${verse.text}"` : '';
    return `📖 ${verseRef}${verseBody}\n\n📝 묵상:\n${memo.content}\n\n- BibleApp`;
  };

  // 공유 (기본 공유 시트)
  const handleShare = async () => {
    if (!memo) return;
    try {
      await Share.share({ message: buildShareText() });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // 카카오톡 공유
  const handleShareKakao = async () => {
    if (!memo) return;
    const text = encodeURIComponent(buildShareText());
    const kakaoUrl = `kakaotalk://msg/text?text=${text}`;
    try {
      const canOpen = await Linking.canOpenURL(kakaoUrl);
      if (canOpen) {
        await Linking.openURL(kakaoUrl);
      } else {
        // 카카오톡 미설치 시 기본 공유 시트
        await Share.share({ message: buildShareText() });
      }
    } catch {
      await Share.share({ message: buildShareText() });
    }
  };

  // 메일 공유
  const handleShareEmail = async () => {
    if (!memo) return;
    const subject = encodeURIComponent(`묵상 나눔 - ${getVerseRangeDisplay()}`);
    const body = encodeURIComponent(buildShareText());
    const mailUrl = `mailto:?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(mailUrl);
    } catch {
      await Share.share({ message: buildShareText() });
    }
  };

  // 공유 방식 선택
  const handleShareMenu = () => {
    if (!memo) return;
    Alert.alert('묵상 공유', '공유 방법을 선택하세요', [
      { text: '카카오톡', onPress: handleShareKakao },
      { text: '이메일', onPress: handleShareEmail },
      { text: '기타 앱', onPress: handleShare },
      { text: '취소', style: 'cancel' },
    ]);
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
    if (!memo) return;
    // VerseHistoryScreen expects "bookId_chapter_verseNum" format
    const verseIdStr = `${memo.book_id}_${memo.chapter}_${memo.verse_num}`;
    navigation.navigate('VerseHistory', { verseId: verseIdStr });
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
          <TouchableOpacity onPress={handleShareMenu} style={styles.headerActionButton}>
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

              {/* 재분석 + 히스토리 버튼 */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionSmallButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={handleReAnalyzeEmotion}
                >
                  <Ionicons name="refresh" size={14} color={colors.primary} />
                  <Text style={[styles.actionSmallButtonText, { color: colors.primary }]}>재분석</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionSmallButton, { backgroundColor: colors.border }]}
                  onPress={handleShowEmotionHistory}
                >
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.actionSmallButtonText, { color: colors.textSecondary }]}>이전 분석</Text>
                </TouchableOpacity>
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
                onPress={handleReAnalyzeEmotion}
              >
                <Text style={styles.analyzeButtonText}>
                  감정분석 시작하기
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 묵상 AI 피드백 (SOLAR 10.7B) */}
        <View style={[styles.emotionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.emotionHeader}>
            <View style={styles.emotionHeaderLeft}>
              <Text style={styles.emotionHeaderIcon}>📖</Text>
              <Text style={[styles.emotionLabel, { color: colors.text }]}>
                AI 묵상 피드백
              </Text>
            </View>
            {feedbackResult && (
              <View style={[styles.confidenceBadge, { backgroundColor: '#10b981' + '15' }]}>
                <Text style={[styles.confidenceText, { color: '#10b981' }]}>SOLAR</Text>
              </View>
            )}
          </View>

          {isFeedbackLoading ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.analyzingText, { color: colors.textSecondary }]}>
                묵상 피드백을 생성하고 있습니다...
              </Text>
              <Text style={[styles.analyzingSubText, { color: colors.textSecondary }]}>
                SOLAR 10.7B 모델 분석 중 (최대 60초)
              </Text>
            </View>
          ) : feedbackResult ? (
            <>
              {/* 성경 요약 */}
              <View style={[styles.feedbackSection, { borderColor: colors.border }]}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>성경 요약</Text>
                <Text style={[styles.feedbackText, { color: colors.text }]}>{feedbackResult.bible_summary}</Text>
              </View>
              {/* 묵상 요약 */}
              <View style={[styles.feedbackSection, { borderColor: colors.border }]}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>묵상 요약</Text>
                <Text style={[styles.feedbackText, { color: colors.text }]}>{feedbackResult.meditation_summary}</Text>
              </View>
              {/* 중점 포인트 */}
              {feedbackResult.focus_points.length > 0 && (
                <View style={styles.keyPhrasesSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>중점 분석</Text>
                  <View style={styles.keyPhrasesRow}>
                    {feedbackResult.focus_points.map((point, i) => (
                      <View key={i} style={[styles.keyPhraseChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.keyPhraseText, { color: colors.text }]}>{point}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {/* 감정 */}
              {feedbackResult.emotions.length > 0 && (
                <View style={styles.emotionTagsSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>감지된 감정</Text>
                  <View style={styles.emotionTagsRow}>
                    {feedbackResult.emotions.map((em, i) => (
                      <View key={i} style={[styles.emotionTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                        <Text style={[styles.emotionTagText, { color: colors.primary }]}>{em}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {/* 피드백 */}
              <View style={[styles.feedbackSection, { borderColor: colors.primary, borderLeftWidth: 3 }]}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>멘토 피드백</Text>
                <Text style={[styles.feedbackText, { color: colors.text, lineHeight: 24 }]}>{feedbackResult.feedback}</Text>
              </View>
              {/* 재요청 + 히스토리 버튼 */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionSmallButton, { backgroundColor: '#10b981' + '15' }]}
                  onPress={handleReRequestFeedback}
                >
                  <Ionicons name="refresh" size={14} color="#10b981" />
                  <Text style={[styles.actionSmallButtonText, { color: '#10b981' }]}>재요청</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionSmallButton, { backgroundColor: colors.border }]}
                  onPress={handleShowFeedbackHistory}
                >
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.actionSmallButtonText, { color: colors.textSecondary }]}>이전 피드백</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : feedbackError ? (
            <View style={styles.beforeAnalyzeContainer}>
              <Text style={styles.beforeAnalyzeIcon}>⚠️</Text>
              <Text style={[styles.beforeAnalyzeText, { color: colors.error }]}>{feedbackError}</Text>
              <TouchableOpacity
                style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                onPress={runFeedback}
              >
                <Text style={styles.analyzeButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.beforeAnalyzeContainer}>
              <Text style={styles.beforeAnalyzeIcon}>✨</Text>
              <Text style={[styles.beforeAnalyzeText, { color: colors.textSecondary }]}>
                AI가 묵상 내용을 분석하고{'\n'}깊이 있는 피드백을 드립니다
              </Text>
              <TouchableOpacity
                style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                onPress={runFeedback}
              >
                <Text style={styles.analyzeButtonText}>묵상 피드백 받기</Text>
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

      {/* 감정분석 히스토리 */}
      {showEmotionHistory && (
        <View style={[styles.historyOverlay, { backgroundColor: colors.background }]}>
          <View style={[styles.historyHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.historyTitle, { color: colors.text }]}>감정분석 히스토리</Text>
            <TouchableOpacity onPress={() => setShowEmotionHistory(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.historyList}>
            {emotionHistory.length === 0 ? (
              <Text style={[styles.historyEmpty, { color: colors.textSecondary }]}>히스토리가 없습니다</Text>
            ) : (
              emotionHistory.map((item, idx) => {
                const data: HybridEmotionResult | null = (() => { try { return JSON.parse(item.result_data); } catch { return null; } })();
                return (
                  <View key={item.history_id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                      {idx === 0 ? '(현재) ' : ''}{formatDate(item.created_at)}
                    </Text>
                    {data && (
                      <View style={styles.historyContent}>
                        <Text style={{ fontSize: 24 }}>{chocoService.getEmotionIcon(data.main_emotion)}</Text>
                        <Text style={[styles.historyMainText, { color: colors.text }]}>{data.main_emotion}</Text>
                        {data.tone ? <Text style={[styles.historySubText, { color: colors.textSecondary }]}>"{data.tone}"</Text> : null}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* 피드백 히스토리 */}
      {showFeedbackHistory && (
        <View style={[styles.historyOverlay, { backgroundColor: colors.background }]}>
          <View style={[styles.historyHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.historyTitle, { color: colors.text }]}>묵상 피드백 히스토리</Text>
            <TouchableOpacity onPress={() => setShowFeedbackHistory(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.historyList}>
            {feedbackHistory.length === 0 ? (
              <Text style={[styles.historyEmpty, { color: colors.textSecondary }]}>히스토리가 없습니다</Text>
            ) : (
              feedbackHistory.map((item, idx) => {
                const data: MeditationFeedbackResult | null = (() => { try { return JSON.parse(item.result_data); } catch { return null; } })();
                return (
                  <View key={item.history_id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                      {idx === 0 ? '(현재) ' : ''}{formatDate(item.created_at)}
                    </Text>
                    {data && (
                      <View style={styles.historyContent}>
                        <Text style={[styles.historySubText, { color: colors.text }]}>{data.feedback}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

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
  // 액션 버튼 행
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  actionSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  actionSmallButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // 히스토리 오버레이
  historyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  historyList: {
    flex: 1,
    padding: 16,
  },
  historyEmpty: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 40,
  },
  historyItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyMainText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historySubText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  // 피드백 섹션
  feedbackSection: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 1,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
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
