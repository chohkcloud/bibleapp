import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BibleStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { useBibleStore } from '../../store';
import { bibleService } from '../../services';

type Props = NativeStackScreenProps<BibleStackParamList, 'ChapterSelect'>;

export function ChapterSelectScreen({ route, navigation }: Props) {
  const { bookId, bookName, chapters: passedChapters } = route.params;
  const { colors } = useTheme();
  const { currentBook, currentChapter } = useBibleStore();

  const [isLoading, setIsLoading] = useState(!passedChapters);
  const [totalChapters, setTotalChapters] = useState(passedChapters || 0);

  // 장 수 로드 (전달받지 않은 경우)
  useEffect(() => {
    if (!passedChapters) {
      loadChapterCount();
    }
  }, [passedChapters, bookId]);

  const loadChapterCount = async () => {
    try {
      const count = await bibleService.getTotalChapters(bookId);
      setTotalChapters(count);
    } catch (error) {
      console.error('Error loading chapter count:', error);
      setTotalChapters(50); // 기본값
    } finally {
      setIsLoading(false);
    }
  };

  // 책 선택 화면으로 이동
  const handleBookChange = () => {
    navigation.navigate('Bible');
  };

  // 장 선택
  const handleChapterPress = (chapter: number) => {
    navigation.navigate('Reading', { bookId, chapter });
  };

  // 장 데이터 생성
  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  // 장 렌더링
  const renderChapter = ({ item }: { item: number }) => {
    const isCurrentChapter = bookId === currentBook && item === currentChapter;

    return (
      <TouchableOpacity
        style={[
          styles.chapterItem,
          { backgroundColor: colors.surface },
          isCurrentChapter && { backgroundColor: colors.primary },
        ]}
        onPress={() => handleChapterPress(item)}
      >
        <Text
          style={[
            styles.chapterText,
            { color: isCurrentChapter ? '#FFFFFF' : colors.text },
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 책 정보 - 터치하면 책 선택 화면으로 이동 */}
        <TouchableOpacity
          style={[styles.infoHeader, { borderBottomColor: colors.border }]}
          onPress={handleBookChange}
          activeOpacity={0.7}
        >
          <View style={styles.bookInfoRow}>
            <View>
              <Text style={[styles.bookNameText, { color: colors.text }]}>
                {bookName}
              </Text>
              <Text style={[styles.chapterCount, { color: colors.textSecondary }]}>
                총 {totalChapters}장
              </Text>
            </View>
            <View style={styles.changeBookButton}>
              <Text style={[styles.changeBookText, { color: colors.primary }]}>
                책 변경
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* 장 그리드 */}
        <FlatList
          data={chapters}
          renderItem={renderChapter}
          keyExtractor={(item) => item.toString()}
          numColumns={5}
          contentContainerStyle={styles.list}
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
  infoHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  bookInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chapterCount: {
    fontSize: 14,
  },
  changeBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeBookText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  list: {
    padding: 12,
  },
  chapterItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '18%',
  },
  chapterText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
