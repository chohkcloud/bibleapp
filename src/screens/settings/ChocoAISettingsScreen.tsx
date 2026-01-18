import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { SafeContainer } from '../../components/layout';
import { CustomHeader } from '../../components/common';
import {
  saveApiKey,
  getApiKey,
  deleteApiKey,
  setCustomServerUrl,
  getActiveServerUrl,
  checkServerHealth,
  getCurrentEnvironment,
  ChocoAIError,
} from '../../services/chocoAI';

type Props = NativeStackScreenProps<SettingsStackParamList, 'ChocoAISettings'>;

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export function ChocoAISettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();

  // 상태
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 초기값 저장 (변경 감지용)
  const [initialServerUrl, setInitialServerUrl] = useState('');
  const [initialApiKey, setInitialApiKey] = useState('');

  // 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  // 변경 감지
  useEffect(() => {
    const changed = serverUrl !== initialServerUrl || apiKey !== initialApiKey;
    setHasChanges(changed);
  }, [serverUrl, apiKey, initialServerUrl, initialApiKey]);

  const loadSettings = async () => {
    try {
      // 서버 URL 로드
      const currentUrl = getActiveServerUrl();
      setServerUrl(currentUrl);
      setInitialServerUrl(currentUrl);

      // API Key 로드
      const storedApiKey = await getApiKey();
      if (storedApiKey) {
        setApiKey(storedApiKey);
        setInitialApiKey(storedApiKey);
      }
    } catch (error) {
      console.error('[ChocoAI] 설정 로드 실패:', error);
    }
  };

  // 연결 테스트
  const handleTestConnection = useCallback(async () => {
    if (!serverUrl.trim()) {
      Alert.alert('오류', '서버 URL을 입력해주세요.');
      return;
    }

    if (!apiKey.trim()) {
      Alert.alert('오류', 'API Key를 입력해주세요.');
      return;
    }

    setConnectionStatus('testing');
    setConnectionError(null);
    setLatency(null);

    try {
      // 임시로 설정 적용
      setCustomServerUrl(serverUrl);
      await saveApiKey(apiKey);

      // 연결 테스트
      const result = await checkServerHealth();

      if (result.healthy) {
        setConnectionStatus('success');
        setLatency(result.latency || null);
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error?.getUserMessage() || '연결에 실패했습니다.');
      }
    } catch (error) {
      setConnectionStatus('error');
      if (error instanceof ChocoAIError) {
        setConnectionError(error.getUserMessage());
      } else {
        setConnectionError('알 수 없는 오류가 발생했습니다.');
      }
    }
  }, [serverUrl, apiKey]);

  // 저장
  const handleSave = useCallback(async () => {
    if (!serverUrl.trim()) {
      Alert.alert('오류', '서버 URL을 입력해주세요.');
      return;
    }

    if (!apiKey.trim()) {
      Alert.alert('오류', 'API Key를 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      // 서버 URL 저장
      setCustomServerUrl(serverUrl);

      // API Key 저장
      const saved = await saveApiKey(apiKey);

      if (saved) {
        setInitialServerUrl(serverUrl);
        setInitialApiKey(apiKey);
        setHasChanges(false);
        Alert.alert('성공', '설정이 저장되었습니다.');
      } else {
        Alert.alert('오류', 'API Key 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('[ChocoAI] 저장 실패:', error);
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [serverUrl, apiKey]);

  // API Key 삭제
  const handleDeleteApiKey = useCallback(() => {
    Alert.alert(
      'API Key 삭제',
      '저장된 API Key를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApiKey();
              setApiKey('');
              setInitialApiKey('');
              setConnectionStatus('idle');
              Alert.alert('완료', 'API Key가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', 'API Key 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  }, []);

  // 기본값 복원
  const handleResetToDefault = useCallback(() => {
    Alert.alert(
      '기본값 복원',
      '서버 URL을 기본값으로 복원하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          onPress: () => {
            setCustomServerUrl(null);
            const defaultUrl = getActiveServerUrl();
            setServerUrl(defaultUrl);
          },
        },
      ]
    );
  }, []);

  // 연결 상태 아이콘
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'testing':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              연결 테스트 중...
            </Text>
          </View>
        );
      case 'success':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>
              연결 성공 {latency ? `(${latency}ms)` : ''}
            </Text>
          </View>
        );
      case 'error':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <View style={styles.errorContainer}>
              <Text style={[styles.statusText, { color: colors.error }]}>
                연결 실패
              </Text>
              {connectionError && (
                <Text style={[styles.errorDetail, { color: colors.error }]}>
                  {connectionError}
                </Text>
              )}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeContainer edges={['bottom']}>
      <CustomHeader title="Choco AI 설정" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 환경 정보 */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                현재 환경: {getCurrentEnvironment() === 'development' ? '개발' : '프로덕션'}
              </Text>
            </View>
          </View>

          {/* 서버 URL 섹션 */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            서버 URL
          </Text>
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.inputContainer}>
              <Ionicons name="server" size={20} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.0.100:8080"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                onPress={handleResetToDefault}
                style={styles.iconButton}
              >
                <Ionicons name="refresh" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Ollama 프록시 서버의 URL을 입력하세요.
            </Text>
          </View>

          {/* API Key 섹션 */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            API Key
          </Text>
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.inputContainer}>
              <Ionicons name="key" size={20} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="API Key를 입력하세요"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowApiKey(!showApiKey)}
                style={styles.iconButton}
              >
                <Ionicons
                  name={showApiKey ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {apiKey.length > 0 && (
                <TouchableOpacity
                  onPress={handleDeleteApiKey}
                  style={styles.iconButton}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              서버에서 발급받은 API Key를 입력하세요. 안전하게 암호화되어 저장됩니다.
            </Text>
          </View>

          {/* 연결 상태 */}
          {connectionStatus !== 'idle' && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              {renderConnectionStatus()}
            </View>
          )}

          {/* 버튼 영역 */}
          <View style={styles.buttonContainer}>
            {/* 연결 테스트 버튼 */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.testButton,
                { borderColor: colors.primary },
                connectionStatus === 'testing' && styles.buttonDisabled,
              ]}
              onPress={handleTestConnection}
              disabled={connectionStatus === 'testing'}
            >
              {connectionStatus === 'testing' ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color={colors.primary} />
                  <Text style={[styles.buttonText, { color: colors.primary }]}>
                    연결 테스트
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* 저장 버튼 */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                { backgroundColor: colors.primary },
                (!hasChanges || isSaving) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    저장
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 도움말 */}
          <View style={[styles.helpSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>
              <Ionicons name="help-circle" size={16} color={colors.primary} /> 설정 도움말
            </Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              1. 서버 URL: Ollama 프록시 서버의 주소입니다.{'\n'}
              {'   '}• 로컬 테스트: http://192.168.x.x:8080{'\n'}
              {'   '}• 외부 접속: http://your-domain.duckdns.org:8080{'\n\n'}
              2. API Key: 서버 인증에 사용되는 비밀 키입니다.{'\n'}
              {'   '}• 서버의 .env 파일에서 CHOCO_API_KEY 값을 확인하세요.{'\n\n'}
              3. 연결이 실패하면:{'\n'}
              {'   '}• 서버가 실행 중인지 확인하세요.{'\n'}
              {'   '}• 방화벽/포트포워딩 설정을 확인하세요.{'\n'}
              {'   '}• API Key가 올바른지 확인하세요.
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
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
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
  },
  errorDetail: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  testButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  saveButton: {
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});
