// src/components/memo/VersePopup.tsx
// 성경 구절 팝업 모달

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';
import { bibleService } from '../../services';
import { useSettingsStore } from '../../store';
import type { ParsedBibleRef } from '../../utils/bibleRefParser';
import type { Verse } from '../../types/database';

interface VersePopupProps {
  visible: boolean;
  reference: ParsedBibleRef | null;
  onClose: () => void;
  onGoToVerse?: (ref: ParsedBibleRef) => void;
}

export function VersePopup({ visible, reference, onClose, onGoToVerse }: VersePopupProps) {
  const { colors } = useTheme();
  const { bibleVersion } = useSettingsStore();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && reference) {
      loadVerses();
    } else {
      setVerses([]);
    }
  }, [visible, reference]);

  const loadVerses = async () => {
    if (!reference) return;

    setIsLoading(true);
    try {
      const loadedVerses: Verse[] = [];
      // 최대 30절까지만 로드 (성능)
      const maxVerses = Math.min(reference.verseEnd - reference.verseStart + 1, 30);

      for (let i = 0; i < maxVerses; i++) {
        const verseNum = reference.verseStart + i;
        const verse = await bibleService.getVerse(
          bibleVersion,
          reference.bookId,
          reference.chapter,
          verseNum
        );
        if (verse) loadedVerses.push(verse);
      }
      setVerses(loadedVerses);
    } catch (error) {
      console.error('Error loading verses for popup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!reference) return null;

  const verseRangeText = reference.verseStart === reference.verseEnd
    ? `${reference.verseStart}`
    : `${reference.verseStart}-${reference.verseEnd}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[styles.popup, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>
              {reference.bookName} {reference.chapter}:{verseRangeText}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>닫기</Text>
            </TouchableOpacity>
          </View>

          {/* 구절 내용 */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  말씀을 불러오는 중...
                </Text>
              </View>
            ) : verses.length > 0 ? (
              verses.map((verse) => (
                <View key={verse.verse_id} style={styles.verseRow}>
                  <Text style={[styles.verseNum, { color: colors.primary }]}>
                    {verse.verse_num}
                  </Text>
                  <Text style={[styles.verseText, { color: colors.text }]}>
                    {verse.text}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noVerseText, { color: colors.textSecondary }]}>
                구절을 불러올 수 없습니다.
              </Text>
            )}

            {/* 범위가 30절 이상인 경우 안내 */}
            {reference.verseEnd - reference.verseStart >= 30 && (
              <Text style={[styles.truncateNotice, { color: colors.textSecondary }]}>
                ... (최대 30절까지 표시)
              </Text>
            )}
          </ScrollView>

          {/* 해당 구절로 이동 버튼 */}
          {onGoToVerse && verses.length > 0 && (
            <TouchableOpacity
              style={[styles.goButton, { backgroundColor: colors.primary }]}
              onPress={() => onGoToVerse(reference)}
            >
              <Text style={styles.goButtonText}>해당 구절로 이동</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popup: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    maxHeight: 300,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  verseNum: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 28,
    marginRight: 4,
  },
  verseText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  noVerseText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  truncateNotice: {
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
  goButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  goButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default VersePopup;
