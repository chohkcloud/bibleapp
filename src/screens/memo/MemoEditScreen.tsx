import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MemoStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { CustomHeader } from '../../components/common';
import { useSettingsStore } from '../../store';
import { memoService, bibleService } from '../../services';
import type { Verse, Memo } from '../../types/database';

type Props = NativeStackScreenProps<MemoStackParamList, 'MemoEdit'>;

export function MemoEditScreen({ route, navigation }: Props) {
  const { memoId, verseId } = route.params;
  const { colors } = useTheme();
  const { bibleVersion, language } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [verse, setVerse] = useState<Verse | null>(null);
  const [bookName, setBookName] = useState('');
  const [existingMemo, setExistingMemo] = useState<Memo | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const contentInputRef = useRef<TextInput>(null);

  // BUG-003 수정: 키보드 높이 감지
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // 키보드가 올라오면 스크롤뷰를 아래로 스크롤
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [memoId, verseId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 책 이름 로드
      const books = await bibleService.getBooks(language);
      const bookMap: Record<number, string> = {};
      books.forEach((book) => {
        bookMap[book.book_id] = book.book_name;
      });

      if (memoId) {
        // 기존 메모 수정
        const memo = await memoService.getMemo(memoId);
        if (memo) {
          setExistingMemo(memo);
          setContent(memo.content);
          setTags(memo.tags || '');
          setBookName(bookMap[memo.book_id] || `${memo.book_id}권`);

          // 관련 구절 로드
          const verseData = await bibleService.getVerse(
            bibleVersion,
            memo.book_id,
            memo.chapter,
            memo.verse_num
          );
          setVerse(verseData);
        }
      } else if (verseId) {
        // 새 메모 작성 (구절 ID로)
        const verseData = await bibleService.getVerseById(parseInt(verseId, 10));
        if (verseData) {
          setVerse(verseData);
          setBookName(bookMap[verseData.book_id] || `${verseData.book_id}권`);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
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
      if (existingMemo) {
        // 수정
        await memoService.updateMemo(existingMemo.memo_id, {
          content: content.trim(),
          tags: tags.trim() || undefined,
        });
      } else {
        // 새로 생성
        await memoService.createMemo({
          verseId: verse.verse_id,
          bibleId: bibleVersion,
          bookId: verse.book_id,
          chapter: verse.chapter,
          verseNum: verse.verse_num,
          content: content.trim(),
          tags: tags.trim() || undefined,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving memo:', error);
      Alert.alert('오류', '메모 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const headerTitle = memoId ? '묵상 수정' : '묵상 작성';

  const handleSavePress = () => {
    handleSave();
  };

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer edges={['bottom']}>
        <CustomHeader
          title={headerTitle}
          rightButton={{ text: '저장', onPress: handleSavePress }}
        />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['bottom']}>
      <CustomHeader
        title={headerTitle}
        rightButton={{ text: isSaving ? '저장 중...' : '저장', onPress: handleSavePress }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* 구절 정보 */}
          {verse && (
            <View style={[styles.verseCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.verseReference, { color: colors.primary }]}>
                {bookName} {verse.chapter}:{verse.verse_num}
              </Text>
              <Text style={[styles.verseText, { color: colors.text }]}>
                {verse.text}
              </Text>
            </View>
          )}

          {/* 묵상 입력 */}
          <View style={styles.inputSection}>
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
              onFocus={() => {
                // 입력 필드가 포커스되면 약간 위로 스크롤
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 200);
              }}
            />
          </View>

          {/* 태그 입력 */}
          <View style={styles.inputSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              태그 (선택사항)
            </Text>
            <TextInput
              style={[
                styles.tagInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="쉼표로 구분 (예: 사랑, 믿음, 소망)"
              placeholderTextColor={colors.textSecondary}
              value={tags}
              onChangeText={setTags}
            />
          </View>

          {/* 작성 팁 */}
          <View style={[styles.tipCard, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.tipTitle, { color: colors.primary }]}>
              묵상 작성 팁
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • 이 말씀에서 무엇을 배웠나요?{'\n'}
              • 하나님께서 나에게 무엇을 말씀하고 계신가요?{'\n'}
              • 오늘 이 말씀을 어떻게 적용할 수 있을까요?
            </Text>
          </View>

          {/* BUG-003 수정: 키보드 높이만큼 하단 여백 추가 */}
          <View style={[styles.bottomSpacing, { height: keyboardHeight > 0 ? keyboardHeight : 40 }]} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  verseCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 24,
  },
  inputSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  contentInput: {
    minHeight: 200,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  tagInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  tipCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
  bottomSpacing: {
    // 기본 높이는 동적으로 설정됨 (keyboardHeight)
    minHeight: 40,
  },
});
