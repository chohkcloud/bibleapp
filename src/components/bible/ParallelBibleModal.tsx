import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useTheme } from '../../theme';
import { bundledBibleService, ParallelVerse } from '../../services';
import { useDictionaryStore } from '../../store';

interface ParallelBibleModalProps {
  visible: boolean;
  onClose: () => void;
  bookId: number;
  chapter: number;
  verseNum: number;
  bookName?: string;
}

// 사용 가능한 버전
const AVAILABLE_VERSIONS = [
  { id: 'HCV', name: '개역한글', lang: 'ko' },
  { id: 'HKJ', name: '개역개정', lang: 'ko' },
  { id: 'HML', name: '현대인의 성경', lang: 'ko' },
  { id: 'KJV', name: 'KJV', lang: 'en' },
  { id: 'NIV', name: 'NIV', lang: 'en' },
  { id: 'ASV', name: 'ASV', lang: 'en' },
  { id: 'JPM', name: '日本語', lang: 'ja' },
];

// 프리셋
const PRESETS = [
  { name: '한/영', versions: ['HCV', 'KJV'] },
  { name: '한/일', versions: ['HCV', 'JPM'] },
  { name: '한/영/일', versions: ['HCV', 'KJV', 'JPM'] },
  { name: '한글 전체', versions: ['HCV', 'HKJ', 'HML'] },
  { name: '영어 전체', versions: ['KJV', 'NIV', 'ASV'] },
];

export function ParallelBibleModal({
  visible,
  onClose,
  bookId,
  chapter,
  verseNum,
  bookName,
}: ParallelBibleModalProps) {
  const { colors, borderRadius } = useTheme();
  const { parallelVersions, setParallelVersions } = useDictionaryStore();

  const [selectedVersions, setSelectedVersions] = useState<string[]>(parallelVersions);
  const [showSettings, setShowSettings] = useState(false);

  // 선택된 버전들의 절 데이터
  const parallelVerses = useMemo(() => {
    if (!visible || selectedVersions.length === 0) return [];
    return bundledBibleService.getParallelVerses(
      bookId,
      chapter,
      verseNum,
      selectedVersions
    );
  }, [visible, bookId, chapter, verseNum, selectedVersions]);

  // 버전 토글
  const toggleVersion = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((v) => v !== versionId);
      }
      return [...prev, versionId];
    });
  };

  // 프리셋 적용
  const applyPreset = (versions: string[]) => {
    setSelectedVersions(versions);
  };

  // 저장 및 닫기
  const handleClose = () => {
    setParallelVersions(selectedVersions);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 헤더 */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.primary }]}>닫기</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            비교 성경
          </Text>
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            style={styles.settingsButton}
          >
            <Text style={[styles.settingsText, { color: colors.primary }]}>
              {showSettings ? '완료' : '설정'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 구절 정보 */}
        <View style={[styles.verseInfo, { backgroundColor: colors.surface }]}>
          <Text style={[styles.verseReference, { color: colors.text }]}>
            {bookName || `책 ${bookId}`} {chapter}장 {verseNum}절
          </Text>
        </View>

        {/* 설정 패널 */}
        {showSettings && (
          <View style={[styles.settingsPanel, { backgroundColor: colors.surface }]}>
            {/* 프리셋 */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              빠른 선택
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.presetRow}>
                {PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.name}
                    style={[
                      styles.presetButton,
                      {
                        backgroundColor:
                          JSON.stringify(selectedVersions.sort()) ===
                          JSON.stringify(preset.versions.sort())
                            ? colors.primary
                            : colors.border,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                    onPress={() => applyPreset(preset.versions)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        {
                          color:
                            JSON.stringify(selectedVersions.sort()) ===
                            JSON.stringify(preset.versions.sort())
                              ? '#fff'
                              : colors.text,
                        },
                      ]}
                    >
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* 버전 선택 */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>
              버전 선택
            </Text>
            {AVAILABLE_VERSIONS.map((version) => (
              <View
                key={version.id}
                style={[styles.versionItem, { borderBottomColor: colors.border }]}
              >
                <View>
                  <Text style={[styles.versionName, { color: colors.text }]}>
                    {version.name}
                  </Text>
                  <Text style={[styles.versionLang, { color: colors.textSecondary }]}>
                    {version.lang === 'ko' ? '한국어' : version.lang === 'en' ? '영어' : '일본어'}
                  </Text>
                </View>
                <Switch
                  value={selectedVersions.includes(version.id)}
                  onValueChange={() => toggleVersion(version.id)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={
                    selectedVersions.includes(version.id) ? colors.primary : '#f4f3f4'
                  }
                />
              </View>
            ))}
          </View>
        )}

        {/* 비교 성경 내용 */}
        {!showSettings && (
          <ScrollView style={styles.content}>
            {parallelVerses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  비교할 버전을 선택해주세요
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowSettings(true)}
                >
                  <Text style={styles.addButtonText}>버전 선택</Text>
                </TouchableOpacity>
              </View>
            ) : (
              parallelVerses.map((pv) => (
                <View
                  key={pv.versionId}
                  style={[
                    styles.verseCard,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <View style={styles.versionHeader}>
                    <Text style={[styles.versionLabel, { color: colors.primary }]}>
                      {pv.versionName}
                    </Text>
                    <Text style={[styles.langLabel, { color: colors.textSecondary }]}>
                      {pv.language === 'ko' ? '한국어' : pv.language === 'en' ? '영어' : '일본어'}
                    </Text>
                  </View>
                  <Text style={[styles.verseText, { color: colors.text }]}>
                    {pv.text}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 4,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  verseInfo: {
    padding: 12,
    alignItems: 'center',
  },
  verseReference: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsPanel: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionLang: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 16,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verseCard: {
    padding: 16,
    marginBottom: 12,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  langLabel: {
    fontSize: 12,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
  },
});

export default ParallelBibleModal;
