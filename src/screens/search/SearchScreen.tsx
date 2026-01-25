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
import { bibleService } from '../../services';
import type { Verse, Book } from '../../types/database';

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

    try {
      // 책 필터가 있으면 해당 책에서만 검색
      const bookIdFilter = selectedBookId || undefined;

      // FTS5 검색 시도 (전체 결과 표시)
      let searchResults = await bibleService.search(
        bibleVersion,
        trimmedQuery,
        language,
        500,
        0,
        bookIdFilter
      );

      // FTS5 결과 없으면 단순 검색
      if (searchResults.length === 0) {
        searchResults = await bibleService.searchSimple(
          bibleVersion,
          trimmedQuery,
          language,
          500,
          0,
          bookIdFilter
        );
      }

      // 책 이름 추가
      const resultsWithBookName: SearchResult[] = searchResults.map((verse) => ({
        ...verse,
        bookName: bookNames[verse.book_id] || `${verse.book_id}권`,
      }));

      setResults(resultsWithBookName);

      // 최근 검색어 저장
      saveRecentSearch(trimmedQuery);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
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

        {/* 책 필터 */}
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

        {/* 검색 중 */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              검색 중...
            </Text>
          </View>
        )}

        {/* 검색 결과 */}
        {!isSearching && hasSearched && (
          <>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {results.length > 0
                  ? `${results.length}개의 결과${selectedBookId ? ` (${selectedBookName})` : ''}`
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
});
