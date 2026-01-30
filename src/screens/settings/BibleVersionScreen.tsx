// src/screens/settings/BibleVersionScreen.tsx
// 성경 버전 선택 및 다운로드 화면

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { CustomHeader } from '../../components/common/CustomHeader';
import { useSettingsStore, useDownloadStore } from '../../store';
import { bibleVersionService } from '../../services';
import type { BibleVersionInfo, DownloadProgress } from '../../types/database';

export function BibleVersionScreen() {
  const { colors } = useTheme();
  const {
    bibleVersion,
    setBibleVersion,
    downloadedVersions,
    addDownloadedVersion,
    removeDownloadedVersion,
  } = useSettingsStore();
  const {
    activeDownloads,
    startDownload,
    updateProgress,
    completeDownload,
    failDownload,
    clearDownload,
  } = useDownloadStore();

  const [versions, setVersions] = useState<BibleVersionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  // 버전 목록 로드
  const loadVersions = useCallback(async () => {
    try {
      const allVersions = await bibleVersionService.getAllVersions();
      setVersions(allVersions);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // 버전 선택
  const handleSelectVersion = async (version: BibleVersionInfo) => {
    if (!version.isDownloaded && !version.isBundled) {
      Alert.alert('알림', '먼저 버전을 다운로드해주세요.');
      return;
    }

    setBibleVersion(version.id);
    await bibleVersionService.updateLastUsed(version.id);
    Alert.alert('완료', `${version.nameLocal} 버전이 선택되었습니다.`);
  };

  // 다운로드 시작
  const handleDownload = async (version: BibleVersionInfo) => {
    // 네트워크 확인
    const isConnected = await bibleVersionService.checkConnection();
    if (!isConnected) {
      Alert.alert('오류', '인터넷 연결을 확인해주세요.');
      return;
    }

    // 다운로드 시작
    startDownload(version.id, version.size);

    try {
      await bibleVersionService.downloadVersion(version.id, (progress: DownloadProgress) => {
        updateProgress(version.id, progress);

        if (progress.status === 'completed') {
          completeDownload(version.id);
          addDownloadedVersion(version.id);
          loadVersions(); // 목록 새로고침

          Alert.alert('완료', `${version.nameLocal} 다운로드가 완료되었습니다.`, [
            {
              text: '확인',
              onPress: () => clearDownload(version.id),
            },
          ]);
        }
      });
    } catch (error: any) {
      if (error.message !== 'Download cancelled') {
        failDownload(version.id, error.message);
        Alert.alert('오류', `다운로드 실패: ${error.message}`);
      }
      clearDownload(version.id);
    }
  };

  // 다운로드 취소
  const handleCancelDownload = (versionId: string) => {
    bibleVersionService.cancelDownload(versionId);
    clearDownload(versionId);
  };

  // 버전 삭제
  const handleDelete = (version: BibleVersionInfo) => {
    if (version.isBundled) {
      Alert.alert('알림', '기본 버전은 삭제할 수 없습니다.');
      return;
    }

    if (bibleVersion === version.id) {
      Alert.alert('알림', '현재 사용 중인 버전은 삭제할 수 없습니다.');
      return;
    }

    Alert.alert(
      '버전 삭제',
      `${version.nameLocal} 버전을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await bibleVersionService.deleteVersion(version.id);
              removeDownloadedVersion(version.id);
              loadVersions();
              Alert.alert('완료', '버전이 삭제되었습니다.');
            } catch (error: any) {
              Alert.alert('오류', `삭제 실패: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  // 언어 필터
  const languages = bibleVersionService.getLanguages();
  const filteredVersions = selectedLang
    ? versions.filter((v) => v.language === selectedLang)
    : versions;

  // 다운로드된 버전과 다운로드 가능한 버전 분리
  const downloadedList = filteredVersions.filter((v) => v.isDownloaded || v.isBundled);
  const availableList = filteredVersions.filter((v) => !v.isDownloaded && !v.isBundled);

  // 버전 아이템 렌더링
  const renderVersionItem = (version: BibleVersionInfo, isDownloaded: boolean) => {
    const isSelected = bibleVersion === version.id;
    const downloadProgress = activeDownloads[version.id];
    const isDownloading =
      downloadProgress?.status === 'downloading' ||
      downloadProgress?.status === 'processing';

    return (
      <TouchableOpacity
        key={version.id}
        style={[
          styles.versionItem,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isSelected && { borderColor: colors.primary, borderWidth: 2 },
        ]}
        onPress={() => (isDownloaded ? handleSelectVersion(version) : handleDownload(version))}
        disabled={isDownloading}
      >
        <View style={styles.versionInfo}>
          <View style={styles.versionHeader}>
            <Text style={[styles.versionName, { color: colors.text }]}>
              {version.nameLocal}
            </Text>
            {isSelected && (
              <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.selectedText}>사용 중</Text>
              </View>
            )}
            {version.isBundled && !isSelected && (
              <View style={[styles.bundledBadge, { backgroundColor: colors.textSecondary }]}>
                <Text style={styles.bundledText}>기본</Text>
              </View>
            )}
          </View>
          <Text style={[styles.versionDesc, { color: colors.textSecondary }]}>
            {version.languageName} · {bibleVersionService.formatFileSize(version.size)}
          </Text>
          {version.description && (
            <Text
              style={[styles.versionDescription, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {version.description}
            </Text>
          )}

          {/* 다운로드 진행률 */}
          {isDownloading && downloadProgress && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${downloadProgress.progress}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {downloadProgress.status === 'processing' ? 'DB 저장 중...' : '다운로드 중...'}
                {' '}{downloadProgress.progress}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.versionAction}>
          {isDownloading ? (
            <TouchableOpacity
              onPress={() => handleCancelDownload(version.id)}
              style={styles.actionButton}
            >
              <Ionicons name="close-circle" size={28} color={colors.error || '#EF4444'} />
            </TouchableOpacity>
          ) : isDownloaded ? (
            <View style={styles.actionButtons}>
              {!version.isBundled && (
                <TouchableOpacity
                  onPress={() => handleDelete(version)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={24} color={colors.error || '#EF4444'} />
                </TouchableOpacity>
              )}
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleDownload(version)}
              style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              <Text style={styles.downloadText}>다운로드</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeContainer edges={['top', 'bottom']}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <CustomHeader title="성경 버전" showBackButton />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 언어 필터 */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                !selectedLang && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedLang(null)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: !selectedLang ? '#FFFFFF' : colors.text },
                ]}
              >
                전체
              </Text>
            </TouchableOpacity>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.filterChip,
                  { borderColor: colors.border },
                  selectedLang === lang.id && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedLang(lang.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: selectedLang === lang.id ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 다운로드된 버전 */}
        {downloadedList.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              다운로드됨
            </Text>
            {downloadedList.map((v) => renderVersionItem(v, true))}
          </View>
        )}

        {/* 다운로드 가능한 버전 */}
        {availableList.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              다운로드 가능
            </Text>
            {availableList.map((v) => renderVersionItem(v, false))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  versionInfo: {
    flex: 1,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bundledBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bundledText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  versionDesc: {
    fontSize: 13,
    marginBottom: 2,
  },
  versionDescription: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  versionAction: {
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginRight: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    marginTop: 4,
  },
  bottomSpacing: {
    height: 40,
  },
});
