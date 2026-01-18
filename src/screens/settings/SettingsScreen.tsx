import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { CustomHeader } from '../../components/common';
import { useSettingsStore, useAuthStore } from '../../store';
import { authService, backupService } from '../../services';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { fontSize, bibleVersion, language } = useSettingsStore();
  const { setAuthenticated } = useAuthStore();

  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // 생체인식 상태 확인
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const available = await authService.isBiometricAvailable();
      setIsBiometricAvailable(available);
      if (available) {
        const enabled = await authService.isBiometricEnabled();
        setIsBiometricEnabled(enabled);
      }
    } catch (error) {
      console.error('Error checking biometric:', error);
    }
  };

  // 생체인식 토글
  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        // 활성화 전 인증 확인
        const success = await authService.authenticateWithBiometric();
        if (success) {
          await authService.setBiometricEnabled(true);
          setIsBiometricEnabled(true);
        }
      } else {
        await authService.setBiometricEnabled(false);
        setIsBiometricEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('오류', '생체인식 설정에 실패했습니다.');
    }
  };

  // 로그아웃
  const handleLogout = () => {
    Alert.alert(
      '잠금',
      '앱을 잠금 상태로 전환하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '잠금',
          onPress: () => setAuthenticated(false),
        },
      ]
    );
  };

  // 백업 생성
  const handleBackup = async () => {
    try {
      const stats = await backupService.getDataStats();
      Alert.alert(
        '백업 생성',
        `다음 데이터를 백업합니다:\n\n` +
        `메모: ${stats.memoCount}개\n` +
        `북마크: ${stats.bookmarkCount}개\n` +
        `하이라이트: ${stats.highlightCount}개\n` +
        `태그: ${stats.tagCount}개`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '백업',
            onPress: async () => {
              await backupService.createBackup();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('오류', '백업 생성에 실패했습니다.');
    }
  };

  // 백업 복원
  const handleRestore = async () => {
    try {
      await backupService.restoreBackup();
    } catch (error) {
      console.error('Error restoring backup:', error);
      Alert.alert('오류', '백업 복원에 실패했습니다.');
    }
  };

  // 데이터 초기화
  const handleResetData = () => {
    Alert.alert(
      '데이터 초기화',
      '모든 묵상 기록과 설정이 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.clearAllAuthData();
              setAuthenticated(false);
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('오류', '데이터 초기화에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 설정 항목 컴포넌트
  const SettingItem = ({
    icon,
    title,
    value,
    onPress,
    showArrow = true,
    rightComponent,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress && !rightComponent}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      {value && (
        <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
          {value}
        </Text>
      )}
      {rightComponent}
      {showArrow && onPress && !rightComponent && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  // 섹션 헤더 컴포넌트
  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );

  return (
    <SafeContainer edges={['bottom']}>
      <CustomHeader title="설정" showBackButton={false} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 화면 설정 */}
        <SectionHeader title="화면" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingItem
            icon="text"
            title="글자 크기"
            value={`${fontSize}pt`}
            onPress={() => navigation.navigate('FontSize')}
          />
          <SettingItem
            icon="moon"
            title="다크 모드"
            showArrow={false}
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={isDark ? colors.primary : '#F4F4F4'}
              />
            }
          />
        </View>

        {/* 보안 설정 */}
        <SectionHeader title="보안" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingItem
            icon="lock-closed"
            title="비밀번호 변경"
            onPress={() => navigation.navigate('PasswordChange')}
          />
          {isBiometricAvailable && (
            <SettingItem
              icon="finger-print"
              title="생체인식 잠금"
              showArrow={false}
              rightComponent={
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={isBiometricEnabled ? colors.primary : '#F4F4F4'}
                />
              }
            />
          )}
        </View>

        {/* 성경 설정 */}
        <SectionHeader title="성경" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingItem
            icon="book"
            title="성경 버전"
            value={bibleVersion}
            onPress={() => navigation.navigate('BibleVersion')}
          />
          <SettingItem
            icon="language"
            title="언어"
            value={language === 'ko' ? '한국어' : language === 'en' ? 'English' : language}
          />
        </View>

        {/* AI 설정 */}
        <SectionHeader title="AI" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingItem
            icon="sparkles"
            title="Choco AI 설정"
            value="서버 연결"
            onPress={() => navigation.navigate('ChocoAISettings')}
          />
        </View>

        {/* 정보 */}
        <SectionHeader title="정보" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingItem
            icon="information-circle"
            title="앱 정보"
            onPress={() => navigation.navigate('About')}
          />
          <SettingItem
            icon="help-circle"
            title="도움말"
            value="문의하기"
          />
        </View>

        {/* 계정 */}
        <SectionHeader title="계정" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={22} color={colors.text} />
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              앱 잠금
            </Text>
          </TouchableOpacity>
        </View>

        {/* 데이터 관리 */}
        <SectionHeader title="데이터" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingItem
            icon="cloud-upload"
            title="백업하기"
            value="JSON 파일로 저장"
            onPress={handleBackup}
          />
          <SettingItem
            icon="cloud-download"
            title="복원하기"
            value="백업 파일에서 복원"
            onPress={handleRestore}
          />
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomWidth: 0 }]}
            onPress={handleResetData}
          >
            <Ionicons name="trash" size={22} color={colors.error} />
            <Text style={[styles.settingTitle, { color: colors.error }]}>
              데이터 초기화
            </Text>
          </TouchableOpacity>
        </View>

        {/* 앱 버전 */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            BibleApp v1.0.0
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  versionText: {
    fontSize: 13,
  },
  bottomSpacing: {
    height: 40,
  },
});
