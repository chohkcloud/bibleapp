import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BibleStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useBibleStore, useSettingsStore } from '../../store';
import { bibleService, memoService } from '../../services';
import type { Verse, Highlight, Memo } from '../../types/database';

// 상태바 높이 계산
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

type Props = NativeStackScreenProps<BibleStackParamList, 'Reading'>;

interface VerseWithMeta extends Verse {
  isBookmarked?: boolean;
  isHighlighted?: boolean;
  highlightColor?: string;
  hasMemo?: boolean;
  memoContent?: string;
  memoId?: string;
}

const HIGHLIGHT_COLORS = [
  { name: '노랑', color: '#FEF08A' },
  { name: '초록', color: '#BBF7D0' },
  { name: '파랑', color: '#BFDBFE' },
  { name: '분홍', color: '#FBCFE8' },
  { name: '보라', color: '#DDD6FE' },
];

export function ReadingScreen({ route, navigation }: Props) {
  const { bookId, chapter } = route.params;
  const { colors } = useTheme();
  const { setCurrentBook, setCurrentChapter } = useBibleStore();
  const { fontSize, bibleVersion, language } = useSettingsStore();

  const scrollViewRef = useRef<ScrollView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [verses, setVerses] = useState<VerseWithMeta[]>([]);
  const [bookName, setBookName] = useState('');
  const [totalChapters, setTotalChapters] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState<VerseWithMeta | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showNotes, setShowNotes] = useState(true); // 주석 표시 여부

  // 범위 선택 모드
  const [isRangeSelectMode, setIsRangeSelectMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<number | null>(null); // verse_num
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<VerseWithMeta[]>([]);

  // 기본 헤더 숨기기
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 책 정보
      const books = await bibleService.getBooks(language);
      const book = books.find((b) => b.book_id === bookId);
      if (book) {
        setBookName(book.book_name);
      }

      // 총 장 수
      const chapters = await bibleService.getTotalChapters(bookId);
      setTotalChapters(chapters);

      // 구절 로드
      const chapterVerses = await bibleService.getChapterSimple(bibleVersion, bookId, chapter);

      // 하이라이트 로드
      const highlights = await memoService.getHighlightsByChapter(bibleVersion, bookId, chapter);
      const highlightMap = new Map<number, Highlight>();
      highlights.forEach((h) => {
        highlightMap.set(h.verse_id, h);
      });

      // 북마크 확인
      const bookmarks = await memoService.getAllBookmarks();
      const bookmarkSet = new Set(bookmarks.map((b) => b.verse_id));

      // 메모 확인 - 내용도 함께 로드
      const memos = await memoService.getMemos({ bookId, chapter });
      const memoMap = new Map<number, Memo>();
      memos.forEach((m) => {
        // 같은 구절에 여러 메모가 있을 수 있으므로 가장 최근 것 사용
        if (!memoMap.has(m.verse_num) || new Date(m.updated_at) > new Date(memoMap.get(m.verse_num)!.updated_at)) {
          memoMap.set(m.verse_num, m);
        }
      });

      // 메타 정보 추가
      const versesWithMeta: VerseWithMeta[] = chapterVerses.map((verse) => {
        const highlight = highlightMap.get(verse.verse_id);
        const memo = memoMap.get(verse.verse_num);
        return {
          ...verse,
          isBookmarked: bookmarkSet.has(verse.verse_id),
          isHighlighted: !!highlight,
          highlightColor: highlight?.color,
          hasMemo: !!memo,
          memoContent: memo?.content,
          memoId: memo?.memo_id,
        };
      });

      setVerses(versesWithMeta);

      // 현재 위치 저장
      setCurrentBook(bookId);
      setCurrentChapter(chapter);
    } catch (error) {
      console.error('Error loading reading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, chapter, bibleVersion, language, setCurrentBook, setCurrentChapter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 구절 선택
  const handleVersePress = (verse: VerseWithMeta) => {
    // 범위 선택 모드일 때
    if (isRangeSelectMode) {
      handleRangeSelect(verse);
      return;
    }

    // 일반 모드
    setSelectedVerse(verse);
    setNoteText(verse.memoContent || '');
    setIsEditingNote(false);
    setShowActionModal(true);
  };

  // 범위 선택 처리
  const handleRangeSelect = (verse: VerseWithMeta) => {
    if (rangeStart === null) {
      // 시작점 설정
      setRangeStart(verse.verse_num);
      setRangeEnd(null);
      setSelectedRange([verse]);
    } else if (rangeEnd === null) {
      // 끝점 설정
      const start = Math.min(rangeStart, verse.verse_num);
      const end = Math.max(rangeStart, verse.verse_num);
      setRangeStart(start);
      setRangeEnd(end);

      // 범위 내 모든 절 선택
      const rangeVerses = verses.filter(
        v => v.verse_num >= start && v.verse_num <= end
      );
      setSelectedRange(rangeVerses);
    } else {
      // 새로운 선택 시작
      setRangeStart(verse.verse_num);
      setRangeEnd(null);
      setSelectedRange([verse]);
    }
  };

  // 범위 선택 모드 토글
  const toggleRangeSelectMode = () => {
    if (isRangeSelectMode) {
      // 모드 해제 시 초기화
      setRangeStart(null);
      setRangeEnd(null);
      setSelectedRange([]);
    }
    setIsRangeSelectMode(!isRangeSelectMode);
  };

  // 범위 선택 취소
  const cancelRangeSelect = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedRange([]);
    setIsRangeSelectMode(false);
  };

  // 범위 하이라이트 적용
  const handleRangeHighlight = async (color: string) => {
    if (selectedRange.length === 0) return;

    try {
      for (const verse of selectedRange) {
        if (!verse.isHighlighted) {
          await memoService.createHighlight(
            verse.verse_id,
            bibleVersion,
            bookId,
            chapter,
            verse.verse_num,
            color
          );
        }
      }
      loadData();
      cancelRangeSelect();
    } catch (error) {
      console.error('Error applying range highlight:', error);
      Alert.alert('오류', '하이라이트 적용에 실패했습니다.');
    }
  };

  // 범위 하이라이트 제거
  const handleRangeRemoveHighlight = async () => {
    if (selectedRange.length === 0) return;

    try {
      for (const verse of selectedRange) {
        if (verse.isHighlighted) {
          await memoService.removeHighlightFromVerse(verse.verse_id);
        }
      }
      loadData();
      cancelRangeSelect();
    } catch (error) {
      console.error('Error removing range highlight:', error);
      Alert.alert('오류', '하이라이트 제거에 실패했습니다.');
    }
  };

  // 선택된 범위인지 확인
  const isVerseInRange = (verseNum: number): boolean => {
    if (!isRangeSelectMode) return false;
    if (rangeStart === null) return false;
    if (rangeEnd === null) return verseNum === rangeStart;
    return verseNum >= Math.min(rangeStart, rangeEnd) &&
           verseNum <= Math.max(rangeStart, rangeEnd);
  };

  // 북마크 토글
  const handleToggleBookmark = async () => {
    if (!selectedVerse) return;

    try {
      await memoService.toggleBookmark(bibleVersion, bookId, chapter, selectedVerse.verse_num);
      loadData(); // 새로고침
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
    setShowActionModal(false);
  };

  // 하이라이트
  const handleHighlight = async (color: string) => {
    if (!selectedVerse) return;

    try {
      if (selectedVerse.isHighlighted) {
        await memoService.removeHighlightFromVerse(selectedVerse.verse_id);
      } else {
        await memoService.createHighlight(selectedVerse.verse_id, bibleVersion, bookId, chapter, selectedVerse.verse_num, color);
      }
      loadData(); // 새로고침
    } catch (error) {
      console.error('Error highlighting:', error);
    }
    setShowActionModal(false);
  };

  // 메모 작성 (기존 - 상세 화면으로 이동)
  const handleWriteMemo = () => {
    if (!selectedVerse) return;
    setShowActionModal(false);
    navigation.navigate('MemoTab' as any, {
      screen: 'MemoEdit',
      params: { verseId: selectedVerse.verse_id },
    });
  };

  // 주석 저장 (인라인)
  const handleSaveNote = async () => {
    if (!selectedVerse || !noteText.trim()) return;

    try {
      if (selectedVerse.memoId) {
        // 기존 메모 수정
        await memoService.updateMemo(selectedVerse.memoId, { content: noteText.trim() });
      } else {
        // 새 메모 생성
        await memoService.createMemo({
          verseId: selectedVerse.verse_id,
          bibleId: bibleVersion,
          bookId: bookId,
          chapter: chapter,
          verseNum: selectedVerse.verse_num,
          content: noteText.trim(),
        });
      }
      setIsEditingNote(false);
      setShowActionModal(false);
      loadData(); // 새로고침
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('오류', '주석 저장에 실패했습니다.');
    }
  };

  // 주석 삭제
  const handleDeleteNote = () => {
    if (!selectedVerse?.memoId) return;

    Alert.alert(
      '주석 삭제',
      '이 주석을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await memoService.deleteMemo(selectedVerse.memoId!);
              setNoteText('');
              setShowActionModal(false);
              loadData();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('오류', '주석 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 이전/다음 장 이동
  const handlePrevChapter = async () => {
    const prev = await bibleService.getPreviousChapter(bookId, chapter);
    if (prev) {
      navigation.replace('Reading', { bookId: prev.bookId, chapter: prev.chapter });
    }
  };

  const handleNextChapter = async () => {
    const next = await bibleService.getNextChapter(bookId, chapter);
    if (next) {
      navigation.replace('Reading', { bookId: next.bookId, chapter: next.chapter });
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            말씀을 불러오는 중...
          </Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 커스텀 헤더 - 상태바 아래에 위치 */}
      <View style={[styles.customHeader, { paddingTop: STATUSBAR_HEIGHT + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {bookName} {chapter}장
        </Text>
        {/* 범위 선택 모드 버튼 */}
        <TouchableOpacity
          style={[
            styles.rangeSelectButton,
            isRangeSelectMode && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={toggleRangeSelectMode}
        >
          <Text style={[styles.rangeSelectText, { color: isRangeSelectMode ? colors.primary : colors.textSecondary }]}>
            ✂️
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.noteToggleButton}
          onPress={() => setShowNotes(!showNotes)}
        >
          <Text style={[styles.noteToggleText, { color: showNotes ? colors.primary : colors.textSecondary }]}>
            📝
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('ChapterSelect', { bookId, bookName, chapters: totalChapters })}
        >
          <Text style={[styles.listButtonText, { color: colors.primary }]}>목록</Text>
        </TouchableOpacity>
      </View>

      {/* 범위 선택 모드 안내 바 */}
      {isRangeSelectMode && (
        <View style={[styles.rangeSelectBar, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.rangeSelectBarText, { color: colors.primary }]}>
            {rangeStart === null
              ? '📍 시작 절을 선택하세요'
              : rangeEnd === null
                ? `📍 ${rangeStart}절 선택됨 - 끝 절을 선택하세요`
                : `✅ ${rangeStart}-${rangeEnd}절 선택됨 (${selectedRange.length}절)`
            }
          </Text>
          <TouchableOpacity onPress={cancelRangeSelect}>
            <Text style={[styles.rangeSelectCancelText, { color: colors.error }]}>취소</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 장 헤더 */}
        <View style={styles.chapterHeader}>
          <Text style={[styles.chapterTitle, { color: colors.text }]}>
            {bookName} {chapter}장
          </Text>
        </View>

          {/* 구절 목록 - 각 구절을 개별 Pressable로 처리 */}
          <View style={styles.content}>
            {verses.map((verse) => (
              <Pressable
                key={verse.verse_id}
                style={({ pressed }) => [
                  styles.verseRow,
                  pressed && { backgroundColor: colors.primary + '10' },
                  isVerseInRange(verse.verse_num) && { backgroundColor: colors.primary + '20', borderLeftWidth: 3, borderLeftColor: colors.primary }
                ]}
                onPress={() => handleVersePress(verse)}
                onLongPress={() => handleVersePress(verse)}
                delayLongPress={300}
              >
                {/* 구절 번호 */}
                <Text style={[styles.verseNumberInline, { color: isVerseInRange(verse.verse_num) ? colors.primary : colors.primary, fontSize: fontSize * 0.75 }]}>
                  {isVerseInRange(verse.verse_num) && '✓ '}
                  {verse.verse_num}
                  {verse.isBookmarked && ' 🔖'}
                  {verse.hasMemo && ' 📝'}
                </Text>
                {/* 구절 텍스트 */}
                <Text
                  style={[
                    styles.verseTextStyle,
                    { color: colors.text, fontSize, lineHeight: fontSize * 1.8 },
                    verse.isHighlighted && { backgroundColor: verse.highlightColor + '50' }
                  ]}
                >
                  {verse.text}
                </Text>
              </Pressable>
            ))}

            {/* 인라인 주석 목록 (주석이 있는 구절만) */}
            {showNotes && verses.filter(v => v.hasMemo && v.memoContent).length > 0 && (
              <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.notesSectionTitle, { color: colors.textSecondary }]}>
                  💬 주석
                </Text>
                {verses.filter(v => v.hasMemo && v.memoContent).map((verse) => (
                  <TouchableOpacity
                    key={`note-${verse.verse_id}`}
                    style={[styles.inlineNote, { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary }]}
                    onPress={() => handleVersePress(verse)}
                  >
                    <Text style={[styles.noteVerseRef, { color: colors.primary }]}>
                      {verse.verse_num}절
                    </Text>
                    <Text style={[styles.inlineNoteText, { color: colors.textSecondary }]} numberOfLines={2}>
                      {verse.memoContent}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 장 네비게이션 */}
          <View style={[styles.chapterNav, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.navButton, { opacity: chapter > 1 ? 1 : 0.3 }]}
              onPress={handlePrevChapter}
              disabled={chapter <= 1}
            >
              <Text style={[styles.navButtonText, { color: colors.primary }]}>
                ← 이전 장
              </Text>
            </TouchableOpacity>
            <Text style={[styles.navChapter, { color: colors.textSecondary }]}>
              {chapter} / {totalChapters}
            </Text>
            <TouchableOpacity
              style={[styles.navButton, { opacity: chapter < totalChapters ? 1 : 0.3 }]}
              onPress={handleNextChapter}
              disabled={chapter >= totalChapters}
            >
              <Text style={[styles.navButtonText, { color: colors.primary }]}>
                다음 장 →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* 구절 액션 모달 */}
        <Modal
          visible={showActionModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowActionModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowActionModal(false)}
            >
              <View
                style={[styles.modalContent, { backgroundColor: colors.surface }]}
              >
              {selectedVerse && (
                <>
                  {/* 선택된 구절 */}
                  <View style={styles.selectedVerseContainer}>
                    <Text style={[styles.selectedVerseRef, { color: colors.primary }]}>
                      {bookName} {chapter}:{selectedVerse.verse_num}
                    </Text>
                    <Text
                      style={[styles.selectedVerseText, { color: colors.text }]}
                      numberOfLines={3}
                    >
                      {selectedVerse.text}
                    </Text>
                  </View>

                  {/* 하이라이트 색상 */}
                  <View style={styles.highlightSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                      하이라이트
                    </Text>
                    <View style={styles.colorRow}>
                      {HIGHLIGHT_COLORS.map((item) => (
                        <TouchableOpacity
                          key={item.color}
                          style={[
                            styles.colorButton,
                            { backgroundColor: item.color },
                            selectedVerse.highlightColor === item.color && styles.colorSelected,
                          ]}
                          onPress={() => handleHighlight(item.color)}
                        />
                      ))}
                      {selectedVerse.isHighlighted && (
                        <TouchableOpacity
                          style={[styles.colorButton, styles.colorRemove, { borderColor: colors.border }]}
                          onPress={() => handleHighlight('')}
                        >
                          <Text style={{ color: colors.textSecondary }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* 주석 입력 섹션 */}
                  <View style={styles.noteSection}>
                    <View style={styles.noteSectionHeader}>
                      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        ✏️ 주석
                      </Text>
                      {selectedVerse.memoId && (
                        <TouchableOpacity onPress={handleDeleteNote}>
                          <Text style={[styles.deleteNoteText, { color: colors.error }]}>삭제</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={[
                        styles.noteInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="이 구절에 대한 주석을 입력하세요..."
                      placeholderTextColor={colors.textSecondary}
                      value={noteText}
                      onChangeText={setNoteText}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                    {noteText.trim() !== (selectedVerse.memoContent || '') && noteText.trim() && (
                      <TouchableOpacity
                        style={[styles.saveNoteButton, { backgroundColor: colors.primary }]}
                        onPress={handleSaveNote}
                      >
                        <Text style={styles.saveNoteButtonText}>
                          {selectedVerse.memoId ? '주석 수정' : '주석 저장'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 액션 버튼 */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                      onPress={handleToggleBookmark}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        {selectedVerse.isBookmarked ? '🔖 북마크 해제' : '🔖 북마크'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                      onPress={handleWriteMemo}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        📝 상세 묵상
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* 범위 선택 액션 바 */}
        {isRangeSelectMode && rangeEnd !== null && selectedRange.length > 0 && (
          <View style={[styles.rangeActionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Text style={[styles.rangeActionTitle, { color: colors.text }]}>
              {selectedRange.length}절 선택됨
            </Text>
            <View style={styles.rangeActionButtons}>
              {/* 하이라이트 색상 버튼들 */}
              {HIGHLIGHT_COLORS.map((item) => (
                <TouchableOpacity
                  key={item.color}
                  style={[styles.rangeColorButton, { backgroundColor: item.color }]}
                  onPress={() => handleRangeHighlight(item.color)}
                />
              ))}
              {/* 하이라이트 제거 버튼 */}
              <TouchableOpacity
                style={[styles.rangeColorButton, styles.rangeRemoveButton, { borderColor: colors.border }]}
                onPress={handleRangeRemoveHighlight}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listButton: {
    paddingVertical: 8,
    paddingLeft: 12,
  },
  listButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
  scrollView: {
    flex: 1,
  },
  chapterHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
  },
  versesContainer: {
    // 전체 구절을 감싸는 Text 스타일
  },
  verseRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  verseNumberInline: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 36,
    textAlign: 'right',
  },
  verseTextStyle: {
    flex: 1,
  },
  notesSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  notesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteVerseRef: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingVertical: 4,
  },
  verseNumberContainer: {
    width: 32,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookmarkIcon: {
    fontSize: 10,
    marginTop: 2,
  },
  memoIcon: {
    fontSize: 10,
    marginTop: 2,
  },
  noteToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  noteToggleText: {
    fontSize: 18,
  },
  // 범위 선택 관련 스타일
  rangeSelectButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rangeSelectText: {
    fontSize: 18,
  },
  rangeSelectBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rangeSelectBarText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  rangeSelectCancelText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  rangeActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  rangeActionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeColorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeRemoveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  inlineNote: {
    marginBottom: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderRadius: 4,
  },
  inlineNoteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  verseText: {
    flex: 1,
    lineHeight: 28,
  },
  chapterNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 20,
    borderTopWidth: 1,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  navChapter: {
    fontSize: 14,
  },
  bottomSpacing: {
    height: 40,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  selectedVerseContainer: {
    marginBottom: 20,
  },
  selectedVerseRef: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedVerseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  highlightSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  colorRemove: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  noteSection: {
    marginBottom: 16,
  },
  noteSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteNoteText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    maxHeight: 120,
  },
  saveNoteButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
