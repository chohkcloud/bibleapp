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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SearchStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { CustomHeader } from '../../components/common';
import { useSettingsStore } from '../../store';
import { bibleService } from '../../services';
import type { Verse } from '../../types/database';

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

  // 책 이름 로드
  useEffect(() => {
    loadBookNames();
  }, [language]);

  const loadBookNames = async () => {
    try {
      const books = await bibleService.getBooks(language);
      const names: Record<number, string> = {};
      books.forEach((book) => {
        names[book.book_id] = book.book_name;
      });
      setBookNames(names);
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
      // FTS5 검색 시도 (전체 결과 표시)
      let searchResults = await bibleService.search(bibleVersion, trimmedQuery, language);

      // FTS5 결과 없으면 단순 검색
      if (searchResults.length === 0) {
        searchResults = await bibleService.searchSimple(bibleVersion, trimmedQuery, language);
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
    <SafeContainer edges={['bottom']}>
      <CustomHeader title="검색" showBackButton={false} />
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
                  ? `${results.length}개의 결과`
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
});
