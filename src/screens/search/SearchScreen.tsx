import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SearchStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useSettingsStore } from '../../store';
import { bibleService, dictionaryService } from '../../services';
import type { Verse, Book } from '../../types/database';
import type { StrongEntry, DictEntry } from '../../types/dictionary';

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

interface SearchResult extends Verse {
  bookName: string;
}

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 10;

export function SearchScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { bibleVersion, language } = useSettingsStore();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [bookNames, setBookNames] = useState<Record<number, string>>({});

  // 페이징 관련 상태
  const PAGE_SIZE = 50;
  const [totalBibleCount, setTotalBibleCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 탭 관련 상태 (성경 / 사전)
  const [activeTab, setActiveTab] = useState<'bible' | 'dictionary'>('bible');
  const [dictResults, setDictResults] = useState<DictEntry[]>([]);
  const [strongResults, setStrongResults] = useState<StrongEntry[]>([]);
  const [dictPage, setDictPage] = useState(0);
  const [strongPage, setStrongPage] = useState(0);
  const DICT_PAGE_SIZE = 30;

  // 사전 전체 개수
  const [totalDictCount, setTotalDictCount] = useState(0);
  const [totalStrongCount, setTotalStrongCount] = useState(0);
  const [isDictLoadingMore, setIsDictLoadingMore] = useState(false);

  // 사전 상세보기 모달 상태
  const [selectedDictEntry, setSelectedDictEntry] = useState<DictEntry | null>(null);
  const [selectedStrongEntry, setSelectedStrongEntry] = useState<StrongEntry | null>(null);
  const [showDictDetailModal, setShowDictDetailModal] = useState(false);

  // 사전 항목 클릭 핸들러
  const handleDictEntryPress = (entry: DictEntry) => {
    setSelectedDictEntry(entry);
    setSelectedStrongEntry(null);
    setShowDictDetailModal(true);
  };

  const handleStrongEntryPress = (entry: StrongEntry) => {
    setSelectedStrongEntry(entry);
    setSelectedDictEntry(null);
    setShowDictDetailModal(true);
  };

  const closeDictDetailModal = () => {
    setShowDictDetailModal(false);
    setSelectedDictEntry(null);
    setSelectedStrongEntry(null);
  };

  // 책 필터 관련 상태
  const [books, setBooks] = useState<(Book & { book_name: string })[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedBookName, setSelectedBookName] = useState<string>('전체');
  const [showBookFilter, setShowBookFilter] = useState(false);

  // 책 이름 로드
  useEffect(() => {
    loadBookNames();
  }, [language]);

  const loadBookNames = async () => {
    try {
      const bookList = await bibleService.getBooks(language);
      const names: Record<number, string> = {};
      bookList.forEach((book) => {
        names[book.book_id] = book.book_name;
      });
      setBookNames(names);
      setBooks(bookList as (Book & { book_name: string })[]);
    } catch (error) {
      console.error('Error loading book names:', error);
    }
  };

  // 화면 포커스 시 초기화
  useFocusEffect(
    useCallback(() => {
      // 이전 검색 결과 유지
    }, [])
  );

  // 검색 실행
  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    Keyboard.dismiss();
    setIsSearching(true);
    setHasSearched(true);
    setCurrentPage(0);
    setDictPage(0);

    try {
      // 책 필터가 있으면 해당 책에서만 검색
      const bookIdFilter = selectedBookId || undefined;

      // 전체 검색 개수 조회
      const totalCount = await bibleService.getSearchCount(
        bibleVersion,
        trimmedQuery,
        language,
        bookIdFilter
      );
      setTotalBibleCount(totalCount);

      // 첫 페이지 검색 결과 (단순 검색 사용)
      const searchResults = await bibleService.searchSimple(
        bibleVersion,
        trimmedQuery,
        language,
        PAGE_SIZE,
        0,
        bookIdFilter
      );

      // 책 이름 추가
      const resultsWithBookName: SearchResult[] = searchResults.map((verse) => ({
        ...verse,
        bookName: bookNames[verse.book_id] || `${verse.book_id}권`,
      }));

      setResults(resultsWithBookName);

      // 사전 검색 - 전체 개수 먼저 조회
      const [dictCount, strongHCount, strongGCount] = await Promise.all([
        dictionaryService.getDictSearchCount(trimmedQuery),
        dictionaryService.getStrongSearchCount(trimmedQuery, 'H'),
        dictionaryService.getStrongSearchCount(trimmedQuery, 'G'),
      ]);

      setTotalDictCount(dictCount);
      setTotalStrongCount(strongHCount + strongGCount);

      // 사전 첫 페이지 로드
      const [dicResults, strongResults] = await Promise.all([
        dictionaryService.searchBibleDictionary(trimmedQuery, DICT_PAGE_SIZE, 0),
        dictionaryService.searchStrong(trimmedQuery, undefined, DICT_PAGE_SIZE, 0),
      ]);

      setDictResults(dicResults);
      setStrongResults(strongResults);

      // 최근 검색어 저장
      saveRecentSearch(trimmedQuery);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalBibleCount(0);
      setDictResults([]);
      setStrongResults([]);
      setTotalDictCount(0);
      setTotalStrongCount(0);
    } finally {
      setIsSearching(false);
    }
  };

  // 성경 검색 더 보기
  const loadMoreBibleResults = async () => {
    if (isLoadingMore || results.length >= totalBibleCount) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const bookIdFilter = selectedBookId || undefined;

    try {
      const moreResults = await bibleService.searchSimple(
        bibleVersion,
        query.trim(),
        language,
        PAGE_SIZE,
        nextPage * PAGE_SIZE,
        bookIdFilter
      );

      const resultsWithBookName: SearchResult[] = moreResults.map((verse) => ({
        ...verse,
        bookName: bookNames[verse.book_id] || `${verse.book_id}권`,
      }));

      setResults(prev => [...prev, ...resultsWithBookName]);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 사전 검색 더 보기
  const loadMoreDictResults = async () => {
    if (isDictLoadingMore) return;

    const hasMoreDict = dictResults.length < totalDictCount;
    const hasMoreStrong = strongResults.length < totalStrongCount;

    if (!hasMoreDict && !hasMoreStrong) return;

    setIsDictLoadingMore(true);

    try {
      const trimmedQuery = query.trim();

      // 성경 사전 더 로드
      if (hasMoreDict) {
        const nextDictPage = dictPage + 1;
        const moreDictResults = await dictionaryService.searchBibleDictionary(
          trimmedQuery,
          DICT_PAGE_SIZE,
          nextDictPage * DICT_PAGE_SIZE
        );
        setDictResults(prev => [...prev, ...moreDictResults]);
        setDictPage(nextDictPage);
      }

      // Strong's 사전 더 로드
      if (hasMoreStrong) {
        const nextStrongPage = strongPage + 1;
        const moreStrongResults = await dictionaryService.searchStrong(
          trimmedQuery,
          undefined,
          DICT_PAGE_SIZE,
          nextStrongPage * DICT_PAGE_SIZE
        );
        setStrongResults(prev => [...prev, ...moreStrongResults]);
        setStrongPage(nextStrongPage);
      }
    } catch (error) {
      console.error('Load more dict error:', error);
    } finally {
      setIsDictLoadingMore(false);
    }
  };

  // 최근 검색어 저장
  const saveRecentSearch = (searchQuery: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== searchQuery);
      return [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    });
  };

  // 최근 검색어 클릭
  const handleRecentSearchPress = (searchQuery: string) => {
    setQuery(searchQuery);
    // 자동으로 검색 실행
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // 검색어 삭제
  const handleClearQuery = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  // 책 선택
  const handleSelectBook = (bookId: number | null, bookName: string) => {
    setSelectedBookId(bookId);
    setSelectedBookName(bookName);
    setShowBookFilter(false);
  };

  // 필터 초기화
  const handleClearFilter = () => {
    setSelectedBookId(null);
    setSelectedBookName('전체');
  };

  // 결과 클릭
  const handleResultPress = (result: SearchResult) => {
    navigation.navigate('BibleTab' as any, {
      screen: 'Reading',
      params: {
        bookId: result.book_id,
        chapter: result.chapter,
      },
    });
  };

  // 하이라이트 텍스트
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <Text key={index} style={[styles.highlightedText, { backgroundColor: colors.primary + '40' }]}>
          {part}
        </Text>
      ) : (
        <Text key={index}>{part}</Text>
      )
    );
  };

  // 결과 렌더링
  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: colors.border }]}
      onPress={() => handleResultPress(item)}
    >
      <Text style={[styles.resultReference, { color: colors.primary }]}>
        {item.bookName} {item.chapter}:{item.verse_num}
      </Text>
      <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={3}>
        {highlightText(item.text, query.trim())}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 검색 입력 */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="성경 검색..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClearQuery} style={styles.clearButton}>
                <Text style={{ color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            <Text style={styles.searchButtonText}>검색</Text>
          </TouchableOpacity>
        </View>

        {/* 탭 선택 */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'bible' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('bible')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'bible' ? colors.primary : colors.textSecondary }
            ]}>
              📖 성경 {hasSearched && totalBibleCount > 0 && `(${totalBibleCount.toLocaleString()}건)`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'dictionary' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('dictionary')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'dictionary' ? colors.primary : colors.textSecondary }
            ]}>
              📚 사전 {hasSearched && (totalDictCount + totalStrongCount) > 0 && `(${(totalDictCount + totalStrongCount).toLocaleString()}건)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 책 필터 (성경 탭에서만 표시) */}
        {activeTab === 'bible' && (
          <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: colors.background, borderColor: selectedBookId ? colors.primary : colors.border }]}
              onPress={() => setShowBookFilter(true)}
            >
              <Text style={styles.filterIcon}>📖</Text>
              <Text style={[styles.filterText, { color: selectedBookId ? colors.primary : colors.text }]}>
                {selectedBookName}
              </Text>
              <Text style={{ color: colors.textSecondary }}>▼</Text>
            </TouchableOpacity>
            {selectedBookId && (
              <TouchableOpacity
                style={[styles.clearFilterButton, { backgroundColor: colors.error + '20' }]}
                onPress={handleClearFilter}
              >
                <Text style={[styles.clearFilterText, { color: colors.error }]}>✕ 필터 해제</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 검색 중 */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              검색 중...
            </Text>
          </View>
        )}

        {/* 검색 결과 - 성경 탭 */}
        {!isSearching && hasSearched && activeTab === 'bible' && (
          <>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {totalBibleCount > 0
                  ? `전체 ${totalBibleCount.toLocaleString()}건 중 ${results.length.toLocaleString()}건 표시${selectedBookId ? ` (${selectedBookName})` : ''}`
                  : '검색 결과가 없습니다'}
              </Text>
            </View>

            {results.length > 0 ? (
              <FlatList
                data={results}
                renderItem={renderResult}
                keyExtractor={(item) => String(item.verse_id)}
                contentContainerStyle={styles.resultList}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={() => (
                  results.length < totalBibleCount ? (
                    <TouchableOpacity
                      style={[styles.loadMoreButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={loadMoreBibleResults}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                          더 보기 ({results.length} / {totalBibleCount.toLocaleString()})
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : null
                )}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📖</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  검색 결과가 없습니다
                </Text>
                <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                  다른 검색어로 시도해보세요
                </Text>
              </View>
            )}
          </>
        )}

        {/* 검색 결과 - 사전 탭 */}
        {!isSearching && hasSearched && activeTab === 'dictionary' && (
          <ScrollView style={styles.dictResultsContainer} showsVerticalScrollIndicator={false}>
            {/* 전체 결과 요약 */}
            <View style={styles.dictSummary}>
              <Text style={[styles.dictSummaryText, { color: colors.textSecondary }]}>
                전체 {(totalDictCount + totalStrongCount).toLocaleString()}건 (Strong's {totalStrongCount.toLocaleString()}건, 성경사전 {totalDictCount.toLocaleString()}건)
              </Text>
            </View>

            {/* Strong's 사전 결과 */}
            {strongResults.length > 0 && (
              <View style={styles.dictSection}>
                <Text style={[styles.dictSectionTitle, { color: colors.text }]}>
                  📜 Strong's 원어 사전 ({strongResults.length}/{totalStrongCount.toLocaleString()}건)
                </Text>
                {strongResults.map((entry, index) => (
                  <TouchableOpacity
                    key={`strong-${entry.num}-${index}`}
                    style={[styles.strongItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleStrongEntryPress(entry)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.strongHeader}>
                      <Text style={[styles.strongNum, { color: colors.primary }]}>
                        {entry.num}
                      </Text>
                      <Text style={[styles.strongOriginal, { color: colors.text }]}>
                        {entry.original}
                      </Text>
                    </View>
                    <Text style={[styles.strongTranslit, { color: colors.textSecondary }]}>
                      {entry.transliteration} {entry.pronunciationKo && `(${entry.pronunciationKo})`}
                    </Text>
                    <Text style={[styles.strongMeaning, { color: colors.text }]} numberOfLines={3}>
                      {entry.meaningKo || entry.meaning}
                    </Text>
                    <Text style={[styles.tapHint, { color: colors.textSecondary }]}>탭하여 상세보기</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 성경 사전 결과 */}
            {dictResults.length > 0 && (
              <View style={styles.dictSection}>
                <Text style={[styles.dictSectionTitle, { color: colors.text }]}>
                  📕 성경 사전 ({dictResults.length}/{totalDictCount.toLocaleString()}건)
                </Text>
                {dictResults.map((entry, index) => (
                  <TouchableOpacity
                    key={`dict-${entry.id}-${index}`}
                    style={[styles.dictItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleDictEntryPress(entry)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dictHeader}>
                      <Text style={[styles.dictTerm, { color: colors.primary }]}>
                        {entry.term}
                      </Text>
                      {entry.termEn && (
                        <Text style={[styles.dictTermEn, { color: colors.textSecondary }]}>
                          ({entry.termEn})
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.dictDefinition, { color: colors.text }]} numberOfLines={4}>
                      {entry.shortMeaning || entry.definition}
                    </Text>
                    <Text style={[styles.tapHint, { color: colors.textSecondary }]}>탭하여 상세보기</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 사전 더 보기 버튼 */}
            {(dictResults.length < totalDictCount || strongResults.length < totalStrongCount) && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}
                onPress={loadMoreDictResults}
                disabled={isDictLoadingMore}
              >
                {isDictLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                    더 보기 ({(dictResults.length + strongResults.length).toLocaleString()} / {(totalDictCount + totalStrongCount).toLocaleString()}건)
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* 사전 결과 없음 */}
            {dictResults.length === 0 && strongResults.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  사전 검색 결과가 없습니다
                </Text>
                <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                  다른 검색어로 시도해보세요
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* 초기 화면 (검색 전) */}
        {!isSearching && !hasSearched && (
          <View style={styles.initialContainer}>
            {/* 최근 검색어 */}
            {recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  최근 검색어
                </Text>
                <View style={styles.recentTags}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.recentTag, { backgroundColor: colors.surface }]}
                      onPress={() => handleRecentSearchPress(search)}
                    >
                      <Text style={[styles.recentTagText, { color: colors.text }]}>
                        {search}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 검색 가이드 */}
            <View style={styles.guideSection}>
              <Text style={styles.guideIcon}>💡</Text>
              <Text style={[styles.guideTitle, { color: colors.text }]}>
                검색 도움말
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                • 단어나 구절을 입력하세요{'\n'}
                • 예: "사랑", "하나님의 사랑", "요한복음 3:16"{'\n'}
                • 한글과 영어 검색 모두 가능합니다
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 사전 상세보기 모달 */}
      <Modal
        visible={showDictDetailModal}
        transparent
        animationType="slide"
        onRequestClose={closeDictDetailModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={closeDictDetailModal}
        >
          <Pressable
            style={[styles.dictDetailModal, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <View style={[styles.dictDetailHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dictDetailTitle, { color: colors.text }]}>
                {selectedStrongEntry ? 'Strong\'s 원어 사전' : '성경 사전'}
              </Text>
              <TouchableOpacity onPress={closeDictDetailModal}>
                <Text style={{ color: colors.textSecondary, fontSize: 24 }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* 내용 */}
            <ScrollView style={styles.dictDetailContent} showsVerticalScrollIndicator={false}>
              {selectedStrongEntry && (
                <>
                  <View style={styles.dictDetailSection}>
                    <Text style={[styles.dictDetailNum, { color: colors.primary }]}>
                      {selectedStrongEntry.num}
                    </Text>
                    <Text style={[styles.dictDetailOriginal, { color: colors.text }]}>
                      {selectedStrongEntry.original}
                    </Text>
                  </View>

                  <View style={[styles.dictDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.dictDetailLabel, { color: colors.textSecondary }]}>음역</Text>
                    <Text style={[styles.dictDetailValue, { color: colors.text }]}>
                      {selectedStrongEntry.transliteration}
                    </Text>
                  </View>

                  <View style={[styles.dictDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.dictDetailLabel, { color: colors.textSecondary }]}>발음</Text>
                    <Text style={[styles.dictDetailValue, { color: colors.text }]}>
                      {selectedStrongEntry.pronunciation} ({selectedStrongEntry.pronunciationKo})
                    </Text>
                  </View>

                  <View style={styles.dictDetailMeaningSection}>
                    <Text style={[styles.dictDetailLabel, { color: colors.textSecondary }]}>의미 (한글)</Text>
                    <Text style={[styles.dictDetailMeaning, { color: colors.text }]}>
                      {selectedStrongEntry.meaningKo || '(한글 의미 없음)'}
                    </Text>
                  </View>

                  <View style={styles.dictDetailMeaningSection}>
                    <Text style={[styles.dictDetailLabel, { color: colors.textSecondary }]}>의미 (영문)</Text>
                    <Text style={[styles.dictDetailMeaning, { color: colors.text }]}>
                      {selectedStrongEntry.meaning}
                    </Text>
                  </View>

                  {selectedStrongEntry.usage && (
                    <View style={styles.dictDetailMeaningSection}>
                      <Text style={[styles.dictDetailLabel, { color: colors.textSecondary }]}>용례</Text>
                      <Text style={[styles.dictDetailMeaning, { color: colors.text }]}>
                        {selectedStrongEntry.usage}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {selectedDictEntry && (
                <>
                  <View style={styles.dictDetailSection}>
                    <Text style={[styles.dictDetailTerm, { color: colors.primary }]}>
                      {selectedDictEntry.term}
                    </Text>
                    {selectedDictEntry.termEn && (
                      <Text style={[styles.dictDetailTermEn, { color: colors.textSecondary }]}>
                        ({selectedDictEntry.termEn})
                      </Text>
                    )}
                  </View>

                  <View style={[styles.dictDetailCategoryBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.dictDetailCategoryText, { color: colors.primary }]}>
                      {selectedDictEntry.category}
                    </Text>
                  </View>

                  <View style={styles.dictDetailMeaningSection}>
                    <Text style={[styles.dictDetailLabel, { color: colors.textSecondary }]}>정의</Text>
                    <Text style={[styles.dictDetailDefinition, { color: colors.text }]}>
                      {selectedDictEntry.definition}
                    </Text>
                  </View>

                  {selectedDictEntry.references && selectedDictEntry.references.length > 0 && (
                    <View style={styles.dictDetailMeaningSection}>
                      <Text style={[styles.dictDetailLabel, { color: colors.textSecondary }]}>관련 구절</Text>
                      <View style={styles.dictDetailReferences}>
                        {selectedDictEntry.references.map((ref, i) => (
                          <Text key={i} style={[styles.dictDetailRef, { color: colors.primary }]}>
                            {ref}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedDictEntry.related && selectedDictEntry.related.length > 0 && (
                    <View style={styles.dictDetailMeaningSection}>
                      <Text style={[styles.dictDetailLabel, { color: colors.textSecondary }]}>관련 항목</Text>
                      <View style={styles.dictDetailRelated}>
                        {selectedDictEntry.related.map((rel, i) => (
                          <Text key={i} style={[styles.dictDetailRelatedItem, { color: colors.text, backgroundColor: colors.background }]}>
                            {rel}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 책 선택 모달 */}
      <Modal
        visible={showBookFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookFilter(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowBookFilter(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>검색할 책 선택</Text>
              <TouchableOpacity onPress={() => setShowBookFilter(false)}>
                <Text style={{ color: colors.textSecondary, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bookList} showsVerticalScrollIndicator={false}>
              {/* 전체 선택 옵션 */}
              <TouchableOpacity
                style={[
                  styles.bookItem,
                  { borderBottomColor: colors.border },
                  selectedBookId === null && { backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => handleSelectBook(null, '전체')}
              >
                <Text style={[styles.bookItemText, { color: colors.text }]}>📚 전체 성경</Text>
                {selectedBookId === null && (
                  <Text style={{ color: colors.primary }}>✓</Text>
                )}
              </TouchableOpacity>

              {/* 구약 */}
              <View style={[styles.testamentHeader, { backgroundColor: colors.background }]}>
                <Text style={[styles.testamentTitle, { color: colors.textSecondary }]}>구약 (39권)</Text>
              </View>
              {books.filter(b => b.book_id <= 39).map((book) => (
                <TouchableOpacity
                  key={book.book_id}
                  style={[
                    styles.bookItem,
                    { borderBottomColor: colors.border },
                    selectedBookId === book.book_id && { backgroundColor: colors.primary + '20' },
                  ]}
                  onPress={() => handleSelectBook(book.book_id, book.book_name)}
                >
                  <Text style={[styles.bookItemText, { color: colors.text }]}>{book.book_name}</Text>
                  {selectedBookId === book.book_id && (
                    <Text style={{ color: colors.primary }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              {/* 신약 */}
              <View style={[styles.testamentHeader, { backgroundColor: colors.background }]}>
                <Text style={[styles.testamentTitle, { color: colors.textSecondary }]}>신약 (27권)</Text>
              </View>
              {books.filter(b => b.book_id >= 40).map((book) => (
                <TouchableOpacity
                  key={book.book_id}
                  style={[
                    styles.bookItem,
                    { borderBottomColor: colors.border },
                    selectedBookId === book.book_id && { backgroundColor: colors.primary + '20' },
                  ]}
                  onPress={() => handleSelectBook(book.book_id, book.book_name)}
                >
                  <Text style={[styles.bookItemText, { color: colors.text }]}>{book.book_name}</Text>
                  {selectedBookId === book.book_id && (
                    <Text style={{ color: colors.primary }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  resultHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCount: {
    fontSize: 14,
  },
  resultList: {
    paddingBottom: 20,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  resultReference: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 22,
  },
  highlightedText: {
    fontWeight: '600',
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
  },
  initialContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recentSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  recentTagText: {
    fontSize: 14,
  },
  guideSection: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  guideIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  guideText: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
  },
  // 필터 스타일
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    marginRight: 6,
  },
  clearFilterButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bookList: {
    flex: 1,
  },
  testamentHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  testamentTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  bookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  bookItemText: {
    fontSize: 16,
  },
  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // 사전 결과 스타일
  dictResultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dictSummary: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  dictSummaryText: {
    fontSize: 13,
  },
  dictSection: {
    marginTop: 8,
  },
  dictSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  strongItem: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  strongHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  strongNum: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 10,
  },
  strongOriginal: {
    fontSize: 18,
    fontWeight: '500',
  },
  strongTranslit: {
    fontSize: 13,
    marginBottom: 6,
  },
  strongMeaning: {
    fontSize: 14,
    lineHeight: 20,
  },
  dictItem: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  dictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dictTerm: {
    fontSize: 16,
    fontWeight: '700',
  },
  dictTermEn: {
    fontSize: 14,
    marginLeft: 8,
  },
  dictDefinition: {
    fontSize: 14,
    lineHeight: 20,
  },
  tapHint: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
  // 사전 상세보기 모달 스타일
  dictDetailModal: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dictDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  dictDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dictDetailContent: {
    flex: 1,
    padding: 16,
  },
  dictDetailSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  dictDetailNum: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
  },
  dictDetailOriginal: {
    fontSize: 24,
    fontWeight: '500',
  },
  dictDetailTerm: {
    fontSize: 22,
    fontWeight: '700',
  },
  dictDetailTermEn: {
    fontSize: 16,
    marginLeft: 8,
  },
  dictDetailCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  dictDetailCategoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dictDetailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dictDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 60,
  },
  dictDetailValue: {
    fontSize: 15,
    flex: 1,
  },
  dictDetailMeaningSection: {
    marginTop: 16,
  },
  dictDetailMeaning: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 8,
  },
  dictDetailDefinition: {
    fontSize: 15,
    lineHeight: 26,
    marginTop: 8,
  },
  dictDetailReferences: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  dictDetailRef: {
    fontSize: 14,
    fontWeight: '500',
  },
  dictDetailRelated: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  dictDetailRelatedItem: {
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // 더 보기 버튼 스타일
  loadMoreButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
