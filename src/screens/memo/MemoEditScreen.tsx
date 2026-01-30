import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
  useWindowDimensions,
  StatusBar,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MemoStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../store';
import { memoService, bibleService, chocoService } from '../../services';
import { bundledBibleService } from '../../services/bundledBibleService';
import type { HybridEmotionResult, AnalyzeResult } from '../../services/chocoService';
import type { Verse, Memo } from '../../types/database';

type Props = NativeStackScreenProps<MemoStackParamList, 'MemoEdit'>;

export function MemoEditScreen({ route, navigation }: Props) {
  const { memoId, verseId, bookId: paramBookId, chapter: paramChapter, verseRange } = route.params;
  const { colors } = useTheme();
  const { bibleVersion, language } = useSettingsStore();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [verse, setVerse] = useState<Verse | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]); // 다중 구절
  const [bookName, setBookName] = useState('');
  const [verseRangeDisplay, setVerseRangeDisplay] = useState(''); // 구절 범위 표시용
  const [existingMemo, setExistingMemo] = useState<Memo | null>(null);
  const [emotionResult, setEmotionResult] = useState<HybridEmotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVerseExpanded, setIsVerseExpanded] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'content' | 'tag' | null>(null);
  const contentInputRef = useRef<TextInput>(null);
  const analyzeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 키보드 높이 감지
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setFocusedInput(null);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // 감정분석 함수 (디바운스 처리)
  const analyzeEmotion = useCallback(async (text: string) => {
    if (!text || text.trim().length < 20) {
      setEmotionResult(null);
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await chocoService.analyzeHybridEmotion(text);
      setEmotionResult(result);
    } catch (error) {
      console.log('[MemoEdit] 감정분석 실패:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // 수동 감정분석 (쿨다운 무시, 피드백 표시 - BUG-A fix)
  const handleManualAnalyze = useCallback(async () => {
    if (isAnalyzing) return;
    setAnalyzeError(null);
    setIsAnalyzing(true);
    try {
      const result: AnalyzeResult = await chocoService.forceAnalyzeHybridEmotion(content);
      if (result.data) {
        setEmotionResult(result.data);
        setAnalyzeError(null);
      } else {
        setEmotionResult(null);
        setAnalyzeError(result.error);
      }
    } catch (error: any) {
      setAnalyzeError(error?.message || '분석 실패');
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, isAnalyzing]);

  // 내용 변경 시 디바운스된 감정분석 실행
  useEffect(() => {
    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current);
    }

    analyzeTimeoutRef.current = setTimeout(() => {
      analyzeEmotion(content);
    }, 2000);

    return () => {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }
    };
  }, [content, analyzeEmotion]);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [memoId, verseId]);

  // 번들/DB 구분하여 구절 로드하는 헬퍼
  const getVerseFromAnySource = (version: string, bookId: number, chap: number, verseNum: number): Verse | null => {
    if (bundledBibleService.isBundled(version)) {
      const bv = bundledBibleService.getVerse(version, bookId, chap, verseNum);
      if (!bv) return null;
      return {
        verse_id: bv.bookId * 1000000 + bv.chapter * 1000 + bv.verse,
        bible_id: version,
        book_id: bv.bookId,
        chapter: bv.chapter,
        verse_num: bv.verse,
        text: bv.text,
      };
    }
    return null; // DB 조회는 async이므로 별도 처리
  };

  const getVerseAsync = async (version: string, bookId: number, chap: number, verseNum: number): Promise<Verse | null> => {
    const bundled = getVerseFromAnySource(version, bookId, chap, verseNum);
    if (bundled) return bundled;
    return await bibleService.getVerse(version, bookId, chap, verseNum);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 상태 초기화 (이전 데이터 잔존 방지 - BUG-C fix)
      setContent('');
      setTags('');
      setExistingMemo(null);
      setEmotionResult(null);
      setAnalyzeError(null);
      setVerse(null);
      setVerses([]);
      setVerseRangeDisplay('');

      const books = await bibleService.getBooks(language);
      const bookMap: Record<number, string> = {};
      books.forEach((book) => {
        bookMap[book.book_id] = book.book_name;
      });

      if (memoId) {
        // 기존 메모 수정 모드
        const memo = await memoService.getMemo(memoId);
        if (memo) {
          setExistingMemo(memo);
          setContent(memo.content);
          setTags(memo.tags || '');
          setBookName(bookMap[memo.book_id] || `${memo.book_id}권`);

          // 다중 구절 지원: verse_range가 있으면 범위 표시
          if (memo.verse_range) {
            setVerseRangeDisplay(memo.verse_range);
            // 첫 번째 구절만 대표로 로드
            const verseData = await getVerseAsync(
              bibleVersion,
              memo.book_id,
              memo.chapter,
              memo.verse_start || memo.verse_num
            );
            setVerse(verseData);
          } else {
            setVerseRangeDisplay(`${memo.verse_num}`);
            const verseData = await getVerseAsync(
              bibleVersion,
              memo.book_id,
              memo.chapter,
              memo.verse_num
            );
            setVerse(verseData);
          }
        }
      } else if (verseRange && paramBookId && paramChapter) {
        // 다중 구절 묵상 작성 모드 (범위 선택)
        setBookName(bookMap[paramBookId] || `${paramBookId}권`);
        setVerseRangeDisplay(verseRange);

        // 범위 파싱해서 구절들 로드
        const verseNums = parseVerseRangeSimple(verseRange);
        const loadedVerses: Verse[] = [];
        for (const vNum of verseNums.slice(0, 5)) { // 최대 5개만 로드 (성능)
          const v = await getVerseAsync(bibleVersion, paramBookId, paramChapter, vNum);
          if (v) loadedVerses.push(v);
        }
        setVerses(loadedVerses);
        if (loadedVerses.length > 0) {
          setVerse(loadedVerses[0]); // 첫 번째 구절을 대표로
        }
      } else if (verseId) {
        // 단일 구절 묵상 작성 모드
        // 번들 버전일 경우 verseId에서 bookId, chapter, verseNum 역산
        if (bundledBibleService.isBundled(bibleVersion)) {
          const vid = typeof verseId === 'number' ? verseId : parseInt(String(verseId), 10);
          const bkId = Math.floor(vid / 1000000);
          const chap = Math.floor((vid % 1000000) / 1000);
          const vNum = vid % 1000;
          const verseData = getVerseFromAnySource(bibleVersion, bkId, chap, vNum);
          if (verseData) {
            setVerse(verseData);
            setBookName(bookMap[verseData.book_id] || `${verseData.book_id}권`);
            setVerseRangeDisplay(`${verseData.verse_num}`);
          }
        } else {
          const verseData = await bibleService.getVerseById(verseId);
          if (verseData) {
            setVerse(verseData);
            setBookName(bookMap[verseData.book_id] || `${verseData.book_id}권`);
            setVerseRangeDisplay(`${verseData.verse_num}`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 간단한 구절 범위 파싱 ("1-16" -> [1,2,...,16], "1,3,5" -> [1,3,5])
  const parseVerseRangeSimple = (range: string): number[] => {
    const verses: number[] = [];
    const parts = range.split(',').map(p => p.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
        for (let i = start; i <= end; i++) {
          verses.push(i);
        }
      } else {
        verses.push(parseInt(part, 10));
      }
    }
    return [...new Set(verses)].sort((a, b) => a - b);
  };

  // 저장
  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('알림', '묵상 내용을 입력해주세요.');
      return;
    }

    if (!verse) {
      Alert.alert('오류', '구절 정보를 찾을 수 없습니다.');
      return;
    }

    setIsSaving(true);

    try {
      let savedMemoId: string;

      if (existingMemo) {
        await memoService.updateMemo(existingMemo.memo_id, {
          content: content.trim(),
          tags: tags.trim() || undefined,
        });
        savedMemoId = existingMemo.memo_id;
      } else {
        // 다중 구절 지원: verseRange가 있으면 범위 정보 포함
        const verseNums = verseRange ? parseVerseRangeSimple(verseRange) : [verse.verse_num];
        const verseStart = Math.min(...verseNums);
        const verseEnd = Math.max(...verseNums);

        const newMemoId = await memoService.createMemo({
          verseId: verse.verse_id,
          bibleId: bibleVersion,
          bookId: paramBookId || verse.book_id,
          chapter: paramChapter || verse.chapter,
          verseNum: verseStart, // 시작 절 (기존 호환)
          verseStart,
          verseEnd,
          verseRange: verseRange || undefined,
          content: content.trim(),
          tags: tags.trim() || undefined,
        });

        savedMemoId = newMemoId;
        // 중복 생성 방지: 저장 후 existingMemo 설정 (BUG-C fix)
        setExistingMemo({ memo_id: newMemoId } as Memo);
      }

      // 감정분석 결과가 있으면 즉시 DB에 저장
      if (emotionResult) {
        await memoService.saveEmotionData(savedMemoId, JSON.stringify(emotionResult));
      }

      // 저장 후 QT 목록으로 이동
      navigation.navigate('MemoList');
    } catch (error) {
      console.error('Error saving memo:', error);
      Alert.alert('오류', '메모 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <View style={[styles.absoluteContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const isKeyboardVisible = keyboardHeight > 0;
  const statusBarHeight = StatusBar.currentHeight || 0;

  // 사용 가능한 높이 계산
  const availableHeight = isKeyboardVisible
    ? windowHeight - keyboardHeight - insets.top - statusBarHeight
    : windowHeight - insets.top - insets.bottom - statusBarHeight;

  // 각 영역 높이 계산
  const headerHeight = 50;
  const verseHeight = isKeyboardVisible ? 40 : 80;
  const bottomInfoHeight = isKeyboardVisible ? 0 : 160;
  const contentHeight = availableHeight - headerHeight - verseHeight - bottomInfoHeight - 40;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.absoluteContainer, { backgroundColor: colors.background }]}>
      {/* 고정 레이아웃 - 상단부터 배치 */}
      <View style={[styles.fixedContent, { top: insets.top + statusBarHeight }]}>

        {/* 헤더 */}
        <Pressable onPress={dismissKeyboard}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {memoId ? '묵상 수정' : '묵상 작성'}
          </Text>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>저장</Text>
            )}
          </TouchableOpacity>
          </View>
        </Pressable>

        {/* 구절 정보 */}
        {verse && (
          <Pressable onPress={dismissKeyboard}>
            <View style={[styles.verseCard, { backgroundColor: colors.surface }]}>
            <View style={styles.verseHeader}>
              <Text style={[styles.verseReference, { color: colors.primary }]} numberOfLines={1}>
                {bookName} {paramChapter || verse.chapter}:{verseRangeDisplay || verse.verse_num}
              </Text>
              {!isKeyboardVisible && (verse.text.length > 50 || verses.length > 1) && (
                <TouchableOpacity
                  onPress={() => setIsVerseExpanded(!isVerseExpanded)}
                  style={styles.expandButton}
                >
                  <Text style={[styles.expandButtonText, { color: colors.primary }]}>
                    {isVerseExpanded ? '접기' : '더보기'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {!isKeyboardVisible && (
              <>
                {verses.length > 1 ? (
                  // 다중 구절 표시
                  <View>
                    {(isVerseExpanded ? verses : verses.slice(0, 2)).map((v, idx) => (
                      <Text
                        key={v.verse_id}
                        style={[styles.verseText, { color: colors.text }]}
                        numberOfLines={isVerseExpanded ? undefined : 1}
                      >
                        <Text style={{ fontWeight: '600', color: colors.primary }}>{v.verse_num}</Text> {v.text}
                      </Text>
                    ))}
                    {!isVerseExpanded && verses.length > 2 && (
                      <Text style={[styles.verseText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                        ... 외 {verses.length - 2}절
                      </Text>
                    )}
                  </View>
                ) : (
                  // 단일 구절 표시
                  <Text
                    style={[styles.verseText, { color: colors.text }]}
                    numberOfLines={isVerseExpanded ? undefined : 2}
                  >
                    {verse.text}
                  </Text>
                )}
              </>
            )}
            </View>
          </Pressable>
        )}

        {/* 묵상 입력 영역 */}
        <View style={[styles.inputSection, { height: contentHeight > 100 ? contentHeight : 100 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            묵상 내용
          </Text>
          <TextInput
            ref={contentInputRef}
            style={[
              styles.contentInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="이 말씀을 통해 깨달은 것, 느낀 것, 적용할 것을 기록해보세요..."
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus={!memoId}
            scrollEnabled={true}
            onFocus={() => setFocusedInput('content')}
          />
        </View>

        {/* 감정분석 & 팁 - 키보드 없을 때만 */}
        {!isKeyboardVisible && (
          <View style={styles.bottomInfo}>
            {(emotionResult || isAnalyzing || analyzeError || content.trim().length >= 20) && (
              <View style={[styles.emotionCard, { backgroundColor: colors.surface }]}>
                <View style={styles.emotionHeader}>
                  <Text style={styles.emotionIcon}>🤖</Text>
                  <Text style={[styles.emotionLabel, { color: colors.text }]}>AI 감정분석</Text>
                  {isAnalyzing && <ActivityIndicator size="small" color={colors.primary} />}
                  {!isAnalyzing && (
                    <TouchableOpacity
                      style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                      onPress={handleManualAnalyze}
                      disabled={content.trim().length < 20}
                    >
                      <Ionicons name="refresh" size={12} color="#fff" />
                      <Text style={styles.analyzeButtonText}>분석</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {isAnalyzing ? (
                  <Text style={[styles.emotionStatus, { color: colors.textSecondary }]}>서버 연결 및 분석 중...</Text>
                ) : analyzeError ? (
                  <Text style={[styles.emotionStatus, { color: '#E74C3C' }]}>{analyzeError}</Text>
                ) : emotionResult ? (
                  <View style={styles.emotionResult}>
                    <Text style={styles.emotionMainIcon}>
                      {chocoService.getEmotionIcon(emotionResult.main_emotion)}
                    </Text>
                    <Text style={[styles.emotionMainText, { color: chocoService.getEmotionColor(emotionResult.main_emotion) }]}>
                      {emotionResult.main_emotion}
                    </Text>
                    <View style={[styles.emotionBadge, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.emotionBadgeText, { color: colors.primary }]}>
                        {Math.round(emotionResult.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.emotionStatus, { color: colors.textSecondary }]}>분석 버튼을 눌러 감정을 분석하세요</Text>
                )}
              </View>
            )}

            <View style={[styles.tipCard, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.tipTitle, { color: colors.primary }]}>묵상 작성 팁</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                • 이 말씀에서 무엇을 배웠나요?{'\n'}
                • 하나님께서 나에게 무엇을 말씀하시나요?
              </Text>
            </View>
          </View>
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fixedContent: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  verseCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verseReference: {
    fontSize: 13,
    fontWeight: '600',
  },
  expandButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verseText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  contentInput: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  bottomInfo: {
    paddingHorizontal: 16,
  },
  emotionCard: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  emotionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emotionStatus: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  emotionResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionMainIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  emotionMainText: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  emotionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emotionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tipCard: {
    padding: 10,
    borderRadius: 12,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
