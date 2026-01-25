import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';

export function AboutScreen() {
  const { colors } = useTheme();

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.appName, { color: colors.text }]}>성경앱</Text>
        <Text style={[styles.version, { color: colors.textSecondary }]}>
          버전 1.0.0
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>정보</Text>
        <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
          다국어 성경 읽기와 묵상 메모를 위한 앱입니다.
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>기능</Text>
        <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
          {`• 다국어 성경 검색 (한국어/영어/일본어)\n• 성경 읽기 & 묵상 메모\n• 메모 분석 및 통계\n• 암호화 보안\n• 묵상 카드 공유`}
        </Text>
      </View>
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  version: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
});
