import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { BibleStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useSettingsStore, useBibleStore } from '../../store';
import { bibleService } from '../../services';

type Props = NativeStackScreenProps<BibleStackParamList, 'Bible'>;

interface BookItem {
  book_id: number;
  book_name: string;
  testament: 'OT' | 'NT';
  chapters: number;
}

interface Section {
  title: string;
  data: BookItem[];
}

export function BibleScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { language } = useSettingsStore();
  const { currentBook, currentChapter } = useBibleStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

  // 책 목록 로드
  const loadBooks = useCallback(async () => {
    try {
      const books = await bibleService.getBooks(language);

      // 구약/신약 분리
      const oldTestament: BookItem[] = [];
      const newTestament: BookItem[] = [];

      for (const book of books) {
        const totalChapters = await bibleService.getTotalChapters(book.book_id);
        const bookItem: BookItem = {
          book_id: book.book_id,
          book_name: book.book_name,
          testament: book.testament,
          chapters: totalChapters,
        };

        if (book.testament === 'OT') {
          oldTestament.push(bookItem);
        } else {
          newTestament.push(bookItem);
        }
      }

      setSections([
        { title: '구약성경', data: oldTestament },
        { title: '신약성경', data: newTestament },
      ]);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [language]);

  // 초기 로드
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // 새로고침
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBooks();
  };

  // 책 선택
  const handleBookPress = (bookId: number, bookName: string, chapters: number) => {
    navigation.navigate('ChapterSelect', { bookId, bookName, chapters });
  };

  // 이어서 읽기
  const handleContinueReading = () => {
    navigation.navigate('Reading', {
      bookId: currentBook,
      chapter: currentChapter,
    });
  };

  // 책 렌더링
  const renderBook = ({ item }: { item: BookItem }) => {
    const isCurrentBook = item.book_id === currentBook;

    return (
      <TouchableOpacity
        style={[
          styles.bookItem,
          { backgroundColor: colors.surface },
          isCurrentBook && { borderColor: colors.primary, borderWidth: 2 },
        ]}
        onPress={() => handleBookPress(item.book_id, item.book_name, item.chapters)}
      >
        <Text
          style={[
            styles.bookName,
            { color: isCurrentBook ? colors.primary : colors.text },
          ]}
          numberOfLines={1}
        >
          {item.book_name}
        </Text>
        <Text style={[styles.bookChapters, { color: colors.textSecondary }]}>
          {item.chapters}장
        </Text>
      </TouchableOpacity>
    );
  };

  // 섹션 헤더 렌더링
  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {section.title}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
        {section.data.length}권
      </Text>
    </View>
  );

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            성경 목록을 불러오는 중...
          </Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 이어서 읽기 카드 */}
        <TouchableOpacity
          style={[styles.continueCard, { backgroundColor: colors.primary }]}
          onPress={handleContinueReading}
        >
          <View>
            <Text style={styles.continueLabel}>이어서 읽기</Text>
            <Text style={styles.continueText}>
              {sections
                .flatMap((s) => s.data)
                .find((b) => b.book_id === currentBook)?.book_name || ''}{' '}
              {currentChapter}장
            </Text>
          </View>
          <Text style={styles.continueArrow}>→</Text>
        </TouchableOpacity>

        {/* 책 목록 */}
        <SectionList
          sections={sections}
          renderItem={renderBook}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.book_id.toString()}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  continueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  continueLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  continueText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  continueArrow: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionCount: {
    fontSize: 14,
  },
  bookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  bookChapters: {
    fontSize: 14,
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
});
