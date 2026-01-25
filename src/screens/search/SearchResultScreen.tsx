import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useSettingsStore } from '../../store';
import { bibleService } from '../../services';
import type { Verse } from '../../types/database';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResult'>;

interface SearchResult extends Verse {
  bookName: string;
}

export function SearchResultScreen({ route, navigation }: Props) {
  const { query } = route.params;
  const { colors } = useTheme();
  const { bibleVersion, language } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [bookNames, setBookNames] = useState<Record<number, string>>({});

  // 검색 실행
  useEffect(() => {
    performSearch();
  }, [query, bibleVersion, language]);

  const performSearch = async () => {
    try {
      setIsLoading(true);

      // 책 이름 로드
      const books = await bibleService.getBooks(language);
      const names: Record<number, string> = {};
      books.forEach((book) => {
        names[book.book_id] = book.book_name;
      });
      setBookNames(names);

      // FTS5 검색 시도 (전체 결과 표시)
      let searchResults = await bibleService.search(bibleVersion, query, language);

      // FTS5 결과 없으면 단순 검색
      if (searchResults.length === 0) {
        searchResults = await bibleService.searchSimple(bibleVersion, query, language);
      }

      // 책 이름 추가
      const resultsWithBookName: SearchResult[] = searchResults.map((verse) => ({
        ...verse,
        bookName: names[verse.book_id] || `${verse.book_id}권`,
      }));

      setResults(resultsWithBookName);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
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
  const highlightText = (text: string) => {
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
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
        {highlightText(item.text)}
      </Text>
    </TouchableOpacity>
  );

  const headerTitle = `"${query}" 검색 결과`;

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['top', 'bottom']}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              검색 중...
            </Text>
          </View>
        </View>
      </SafeContainer>
    );
  }

  // 결과 없음
  if (results.length === 0) {
    return (
      <SafeContainer edges={['top', 'bottom']}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              검색 결과가 없습니다
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              "{query}"에 대한 검색 결과가 없습니다.{'\n'}
              다른 검색어로 시도해보세요.
            </Text>
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 결과 헤더 */}
        <View style={[styles.infoHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
            {results.length}개의 결과
          </Text>
        </View>

        {/* 결과 목록 */}
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => String(item.verse_id)}
          contentContainerStyle={styles.resultList}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  infoHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    lineHeight: 22,
  },
});
