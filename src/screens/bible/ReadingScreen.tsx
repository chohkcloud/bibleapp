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
import * as Clipboard from 'expo-clipboard';
import { versesToRangeString } from '../../utils/bibleRefParser';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BibleStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { ParallelBibleModal } from '../../components/bible';
import { useBibleStore, useSettingsStore } from '../../store';
import { bibleService, memoService, bundledBibleService, dictionaryService } from '../../services';
import type { Verse, Highlight, Memo } from '../../types/database';
import type { BundledComment, CommentaryType } from '../../services/bundledBibleService';
import type { StrongEntry, DictEntry } from '../../types/dictionary';

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
  const { fontSize, bibleVersion, language, commentaryType, setCommentaryType } = useSettingsStore();

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

  // 주석(Commentary) 관련 상태
  const [showCommentaryModal, setShowCommentaryModal] = useState(false);
  const [verseComments, setVerseComments] = useState<BundledComment[]>([]);
  const [chapterComments, setChapterComments] = useState<BundledComment[]>([]);

  // 비교 성경 모달
  const [showParallelModal, setShowParallelModal] = useState(false);

  // 사전 모달
  const [showDictModal, setShowDictModal] = useState(false);
  const [dictSearchQuery, setDictSearchQuery] = useState('');
  const [dictSearchResults, setDictSearchResults] = useState<DictEntry[]>([]);
  const [strongSearchResults, setStrongSearchResults] = useState<StrongEntry[]>([]);
  const [selectedDictEntry, setSelectedDictEntry] = useState<DictEntry | null>(null);
  const [selectedStrongEntry, setSelectedStrongEntry] = useState<StrongEntry | null>(null);
  const [isDictSearching, setIsDictSearching] = useState(false);

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

      // 주석(Commentary) 로드
      const comments = bundledBibleService.getComments(bookId, chapter, commentaryType);
      setChapterComments(comments);

      // 현재 위치 저장
      setCurrentBook(bookId);
      setCurrentChapter(chapter);
    } catch (error) {
      console.error('Error loading reading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, chapter, bibleVersion, language, commentaryType, setCurrentBook, setCurrentChapter]);

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

  // 구절 롱프레스 - 범위 선택 모드 진입
  const handleVerseLongPress = (verse: VerseWithMeta) => {
    if (!isRangeSelectMode) {
      // 범위 선택 모드 진입 및 첫 구절 선택
      setIsRangeSelectMode(true);
      setRangeStart(verse.verse_num);
      setRangeEnd(null);
      setSelectedRange([verse]);
    } else {
      // 이미 범위 선택 모드면 끝점으로 처리
      handleRangeSelect(verse);
    }
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

  // 범위 복사
  const handleRangeCopy = async () => {
    if (selectedRange.length === 0) return;

    try {
      const sortedVerses = [...selectedRange].sort((a, b) => a.verse_num - b.verse_num);
      const verseNums = sortedVerses.map(v => v.verse_num);
      const rangeStr = versesToRangeString(verseNums);

      // 본문 구성: "요한복음 3:1-16\n1 태초에... 2 ..."
      const header = `${bookName} ${chapter}:${rangeStr}`;
      const body = sortedVerses.map(v => `${v.verse_num} ${v.text}`).join('\n');
      const textToCopy = `${header}\n\n${body}`;

      await Clipboard.setStringAsync(textToCopy);
      Alert.alert('복사 완료', `${selectedRange.length}절이 복사되었습니다.`);
      cancelRangeSelect();
    } catch (error) {
      console.error('Error copying range:', error);
      Alert.alert('오류', '복사에 실패했습니다.');
    }
  };

  // 범위 묵상 작성
  const handleRangeMemo = () => {
    if (selectedRange.length === 0) return;

    const sortedVerses = [...selectedRange].sort((a, b) => a.verse_num - b.verse_num);
    const firstVerse = sortedVerses[0];
    const verseNums = sortedVerses.map(v => v.verse_num);
    const rangeStr = versesToRangeString(verseNums);

    cancelRangeSelect();

    navigation.navigate('MemoTab' as any, {
      screen: 'MemoEdit',
      params: {
        verseId: firstVerse.verse_id,
        bookId: bookId,
        chapter: chapter,
        verseRange: rangeStr,  // 다중 구절 범위 전달
      },
    });
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
      params: {
        verseId: selectedVerse.verse_id,  // number 타입으로 전달
        bookId: bookId,
        chapter: chapter,
      },
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

  // 주석(Commentary) 보기
  const handleShowCommentary = () => {
    if (!selectedVerse) return;
    const comments = bundledBibleService.getVerseComments(bookId, chapter, selectedVerse.verse_num, commentaryType);
    setVerseComments(comments);
    setShowCommentaryModal(true);
  };

  // 사전 검색
  const handleDictSearch = async (query: string) => {
    if (!query.trim()) {
      setDictSearchResults([]);
      setStrongSearchResults([]);
      return;
    }

    setIsDictSearching(true);
    try {
      const [dictResults, strongH, strongG] = await Promise.all([
        dictionaryService.searchBibleDictionary(query),
        dictionaryService.searchStrong(query, 'H'),
        dictionaryService.searchStrong(query, 'G'),
      ]);
      setDictSearchResults(dictResults.slice(0, 20));
      setStrongSearchResults([...strongH, ...strongG].slice(0, 20));
    } catch (error) {
      console.error('Dictionary search error:', error);
    } finally {
      setIsDictSearching(false);
    }
  };

  // 사전 모달 열기
  const handleShowDictionary = () => {
    // 선택된 구절의 첫 번째 단어로 자동 검색
    if (selectedVerse) {
      const firstWord = selectedVerse.text.split(/[\s,.:;!?"'()]+/)[0];
      if (firstWord) {
        setDictSearchQuery(firstWord);
        handleDictSearch(firstWord);
      }
    }
    setShowDictModal(true);
  };

  // 사전 모달 닫기
  const closeDictModal = () => {
    setShowDictModal(false);
    setDictSearchQuery('');
    setDictSearchResults([]);
    setStrongSearchResults([]);
    setSelectedDictEntry(null);
    setSelectedStrongEntry(null);
  };

  // 특정 절에 주석이 있는지 확인
  const hasCommentary = (verseNum: number): boolean => {
    return chapterComments.some(
      c => verseNum >= c.verseStart && verseNum <= c.verseEnd
    );
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
                onLongPress={() => handleVerseLongPress(verse)}
                delayLongPress={500}
              >
                {/* 구절 번호 */}
                <Text style={[styles.verseNumberInline, { color: isVerseInRange(verse.verse_num) ? colors.primary : colors.primary, fontSize: fontSize * 0.75 }]}>
                  {isVerseInRange(verse.verse_num) && '✓ '}
                  {verse.verse_num}
                  {verse.isBookmarked && ' 🔖'}
                  {verse.hasMemo && ' 📝'}
                  {hasCommentary(verse.verse_num) && ' 📖'}
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

                  {/* 주석(Commentary), 사전, 비교 성경 버튼 */}
                  <View style={styles.extraButtonsRow}>
                    {hasCommentary(selectedVerse.verse_num) && (
                      <TouchableOpacity
                        style={[styles.commentaryButton, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary, flex: 1, marginRight: 8 }]}
                        onPress={handleShowCommentary}
                      >
                        <Text style={[styles.commentaryButtonText, { color: colors.secondary }]}>
                          📖 주석
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.commentaryButton, { backgroundColor: '#10B981' + '20', borderColor: '#10B981', flex: 1, marginRight: 8 }]}
                      onPress={handleShowDictionary}
                    >
                      <Text style={[styles.commentaryButtonText, { color: '#10B981' }]}>
                        📚 사전
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.commentaryButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary, flex: 1 }]}
                      onPress={() => {
                        setShowActionModal(false);
                        setShowParallelModal(true);
                      }}
                    >
                      <Text style={[styles.commentaryButtonText, { color: colors.primary }]}>
                        🔄 비교
                      </Text>
                    </TouchableOpacity>
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

        {/* 주석(Commentary) 모달 */}
        <Modal
          visible={showCommentaryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCommentaryModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowCommentaryModal(false)}
          >
            <View
              style={[styles.commentaryModalContent, { backgroundColor: colors.surface }]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <View style={styles.commentaryHeader}>
                  <Text style={[styles.commentaryTitle, { color: colors.text }]}>
                    📖 {commentaryType === 'MH' ? '매튜헨리' : '토마호크'} 주석
                  </Text>
                  <TouchableOpacity onPress={() => setShowCommentaryModal(false)}>
                    <Text style={[styles.commentaryCloseText, { color: colors.textSecondary }]}>닫기</Text>
                  </TouchableOpacity>
                </View>

                {/* 주석 타입 선택 */}
                <View style={styles.commentaryTypeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.commentaryTypeButton,
                      commentaryType === 'TH' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      setCommentaryType('TH');
                      const newComments = bundledBibleService.getVerseComments(bookId, chapter, selectedVerse?.verse_num || 1, 'TH');
                      setVerseComments(newComments);
                    }}
                  >
                    <Text style={[styles.commentaryTypeText, { color: commentaryType === 'TH' ? '#fff' : colors.text }]}>
                      토마호크
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.commentaryTypeButton,
                      commentaryType === 'MH' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      setCommentaryType('MH');
                      const newComments = bundledBibleService.getVerseComments(bookId, chapter, selectedVerse?.verse_num || 1, 'MH');
                      setVerseComments(newComments);
                    }}
                  >
                    <Text style={[styles.commentaryTypeText, { color: commentaryType === 'MH' ? '#fff' : colors.text }]}>
                      매튜헨리
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 구절 참조 */}
                {selectedVerse && (
                  <Text style={[styles.commentaryVerseRef, { color: colors.primary }]}>
                    {bookName} {chapter}:{selectedVerse.verse_num}
                  </Text>
                )}

                {/* 주석 내용 */}
                <ScrollView style={styles.commentaryScrollView} showsVerticalScrollIndicator={false}>
                  {verseComments.length > 0 ? (
                    verseComments.map((comment, index) => (
                      <View key={index} style={[styles.commentaryItem, { borderBottomColor: colors.border }]}>
                        {comment.verseStart !== comment.verseEnd && (
                          <Text style={[styles.commentaryVerseRange, { color: colors.textSecondary }]}>
                            {comment.verseStart}-{comment.verseEnd}절
                          </Text>
                        )}
                        {comment.subject && (
                          <Text style={[styles.commentarySubject, { color: colors.text }]}>
                            {comment.subject}
                          </Text>
                        )}
                        <Text style={[styles.commentaryNote, { color: colors.text }]}>
                          {comment.note}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.noCommentaryText, { color: colors.textSecondary }]}>
                      이 구절에 대한 주석이 없습니다.
                    </Text>
                  )}
                </ScrollView>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* 범위 선택 플로팅 액션 바 */}
        {isRangeSelectMode && rangeEnd !== null && selectedRange.length > 0 && (
          <View style={[styles.rangeActionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            {/* 상단: 선택 정보 */}
            <View style={styles.rangeActionHeader}>
              <Text style={[styles.rangeActionTitle, { color: colors.text }]}>
                {rangeStart}-{rangeEnd}절 ({selectedRange.length}절 선택)
              </Text>
              <TouchableOpacity onPress={cancelRangeSelect}>
                <Text style={[styles.rangeActionCancelText, { color: colors.error }]}>취소</Text>
              </TouchableOpacity>
            </View>

            {/* 하단: 액션 버튼들 */}
            <View style={styles.rangeActionButtons}>
              {/* 복사 버튼 */}
              <TouchableOpacity
                style={[styles.rangeActionButton, { backgroundColor: colors.primary + '15' }]}
                onPress={handleRangeCopy}
              >
                <Text style={[styles.rangeActionButtonText, { color: colors.primary }]}>📋 복사</Text>
              </TouchableOpacity>

              {/* 하이라이트 버튼 (색상 선택) */}
              <View style={styles.rangeHighlightSection}>
                {HIGHLIGHT_COLORS.slice(0, 3).map((item) => (
                  <TouchableOpacity
                    key={item.color}
                    style={[styles.rangeColorButton, { backgroundColor: item.color }]}
                    onPress={() => handleRangeHighlight(item.color)}
                  />
                ))}
                {/* 하이라이트 제거 */}
                <TouchableOpacity
                  style={[styles.rangeColorButton, styles.rangeRemoveButton, { borderColor: colors.border }]}
                  onPress={handleRangeRemoveHighlight}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 10 }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 묵상 버튼 */}
              <TouchableOpacity
                style={[styles.rangeActionButton, { backgroundColor: colors.secondary + '15' }]}
                onPress={handleRangeMemo}
              >
                <Text style={[styles.rangeActionButtonText, { color: colors.secondary }]}>📝 묵상</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 사전 검색 모달 */}
        <Modal
          visible={showDictModal}
          transparent
          animationType="slide"
          onRequestClose={closeDictModal}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={closeDictModal}
          >
            <View
              style={[styles.dictModalContent, { backgroundColor: colors.surface }]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <View style={styles.dictModalHeader}>
                  <Text style={[styles.dictModalTitle, { color: colors.text }]}>
                    📚 성경 사전
                  </Text>
                  <TouchableOpacity onPress={closeDictModal}>
                    <Text style={[styles.dictModalCloseText, { color: colors.textSecondary }]}>닫기</Text>
                  </TouchableOpacity>
                </View>

                {/* 검색 입력 */}
                <View style={[styles.dictSearchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.dictSearchInput, { color: colors.text }]}
                    placeholder="단어 검색..."
                    placeholderTextColor={colors.textSecondary}
                    value={dictSearchQuery}
                    onChangeText={(text) => {
                      setDictSearchQuery(text);
                      handleDictSearch(text);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {dictSearchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setDictSearchQuery('');
                        setDictSearchResults([]);
                        setStrongSearchResults([]);
                      }}
                    >
                      <Text style={{ color: colors.textSecondary }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 검색 결과 */}
                <ScrollView style={styles.dictResultsScroll} showsVerticalScrollIndicator={false}>
                  {isDictSearching ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                  ) : (
                    <>
                      {/* Strong's 결과 */}
                      {strongSearchResults.length > 0 && (
                        <View style={styles.dictResultSection}>
                          <Text style={[styles.dictResultSectionTitle, { color: colors.textSecondary }]}>
                            원어 사전 ({strongSearchResults.length})
                          </Text>
                          {strongSearchResults.map((entry, index) => (
                            <TouchableOpacity
                              key={`strong-${entry.num}-${index}`}
                              style={[styles.dictResultItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                              onPress={() => setSelectedStrongEntry(selectedStrongEntry?.num === entry.num ? null : entry)}
                            >
                              <View style={styles.dictResultHeader}>
                                <Text style={[styles.dictResultNum, { color: colors.primary }]}>{entry.num}</Text>
                                <Text style={[styles.dictResultOriginal, { color: colors.text }]}>{entry.original}</Text>
                              </View>
                              <Text style={[styles.dictResultTranslit, { color: colors.textSecondary }]}>
                                {entry.transliteration} ({entry.pronunciationKo})
                              </Text>
                              {selectedStrongEntry?.num === entry.num ? (
                                <Text style={[styles.dictResultMeaning, { color: colors.text }]}>
                                  {entry.meaningKo || entry.meaning}
                                </Text>
                              ) : (
                                <Text style={[styles.dictResultMeaning, { color: colors.text }]} numberOfLines={2}>
                                  {entry.meaningKo || entry.meaning}
                                </Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* 성경 사전 결과 */}
                      {dictSearchResults.length > 0 && (
                        <View style={styles.dictResultSection}>
                          <Text style={[styles.dictResultSectionTitle, { color: colors.textSecondary }]}>
                            성경 사전 ({dictSearchResults.length})
                          </Text>
                          {dictSearchResults.map((entry, index) => (
                            <TouchableOpacity
                              key={`dict-${entry.id}-${index}`}
                              style={[styles.dictResultItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                              onPress={() => setSelectedDictEntry(selectedDictEntry?.id === entry.id ? null : entry)}
                            >
                              <View style={styles.dictResultHeader}>
                                <Text style={[styles.dictResultTerm, { color: colors.primary }]}>{entry.term}</Text>
                                {entry.termEn && (
                                  <Text style={[styles.dictResultTermEn, { color: colors.textSecondary }]}>({entry.termEn})</Text>
                                )}
                              </View>
                              <View style={[styles.dictCategoryBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={[styles.dictCategoryText, { color: colors.primary }]}>{entry.category}</Text>
                              </View>
                              {selectedDictEntry?.id === entry.id ? (
                                <Text style={[styles.dictResultDefinition, { color: colors.text }]}>
                                  {entry.definition}
                                </Text>
                              ) : (
                                <Text style={[styles.dictResultDefinition, { color: colors.text }]} numberOfLines={3}>
                                  {entry.shortMeaning || entry.definition}
                                </Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* 결과 없음 */}
                      {dictSearchQuery.trim() && dictSearchResults.length === 0 && strongSearchResults.length === 0 && !isDictSearching && (
                        <View style={styles.dictNoResults}>
                          <Text style={[styles.dictNoResultsText, { color: colors.textSecondary }]}>
                            검색 결과가 없습니다
                          </Text>
                        </View>
                      )}

                      {/* 검색 가이드 */}
                      {!dictSearchQuery.trim() && (
                        <View style={styles.dictGuide}>
                          <Text style={[styles.dictGuideText, { color: colors.textSecondary }]}>
                            💡 단어를 입력하여 성경 사전과 원어 사전을 검색하세요
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* 비교 성경 모달 */}
        {selectedVerse && (
          <ParallelBibleModal
            visible={showParallelModal}
            onClose={() => setShowParallelModal(false)}
            bookId={bookId}
            chapter={chapter}
            verseNum={selectedVerse.verse_num}
            bookName={bookName}
          />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  rangeActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rangeActionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeActionCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rangeActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  rangeActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeHighlightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeColorButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 4,
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
  // Commentary 스타일
  extraButtonsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  commentaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  commentaryModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  commentaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentaryCloseText: {
    fontSize: 15,
    fontWeight: '500',
  },
  commentaryVerseRef: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  commentaryScrollView: {
    maxHeight: 400,
  },
  commentaryItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  commentaryVerseRange: {
    fontSize: 12,
    marginBottom: 4,
  },
  commentarySubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentaryNote: {
    fontSize: 15,
    lineHeight: 24,
  },
  noCommentaryText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentaryTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  commentaryTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  commentaryTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // 사전 모달 스타일
  dictModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  dictModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dictModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dictModalCloseText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dictSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dictSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  dictResultsScroll: {
    maxHeight: 450,
  },
  dictResultSection: {
    marginBottom: 16,
  },
  dictResultSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  dictResultItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  dictResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dictResultNum: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  dictResultOriginal: {
    fontSize: 16,
    fontWeight: '500',
  },
  dictResultTranslit: {
    fontSize: 12,
    marginBottom: 4,
  },
  dictResultMeaning: {
    fontSize: 14,
    lineHeight: 20,
  },
  dictResultTerm: {
    fontSize: 15,
    fontWeight: '700',
  },
  dictResultTermEn: {
    fontSize: 13,
    marginLeft: 6,
  },
  dictCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginVertical: 6,
  },
  dictCategoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  dictResultDefinition: {
    fontSize: 14,
    lineHeight: 20,
  },
  dictNoResults: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  dictNoResultsText: {
    fontSize: 14,
  },
  dictGuide: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  dictGuideText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
