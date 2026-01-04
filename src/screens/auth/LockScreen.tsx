import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store';
import { SafeContainer } from '../../components/layout';
import { authService } from '../../services';

type Props = NativeStackScreenProps<AuthStackParamList, 'Lock'>;

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30000; // 30초

export function LockScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { setAuthenticated } = useAuthStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockEndTime, setLockEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isPasswordSet, setIsPasswordSet] = useState<boolean | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 초기화
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const passwordSet = await authService.isPasswordSet();
      setIsPasswordSet(passwordSet);

      if (passwordSet) {
        const biometricAvailable = await authService.isBiometricAvailable();
        setIsBiometricAvailable(biometricAvailable);

        if (biometricAvailable) {
          const biometricEnabled = await authService.isBiometricEnabled();
          setIsBiometricEnabled(biometricEnabled);

          // 생체인식이 활성화되어 있으면 자동 시도
          if (biometricEnabled) {
            handleBiometricAuth();
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 잠금 타이머
  useEffect(() => {
    if (!lockEndTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, lockEndTime - Date.now());
      setRemainingTime(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        setIsLocked(false);
        setLockEndTime(null);
        setAttempts(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockEndTime]);

  // PIN 입력 처리
  const handlePinInput = useCallback(
    async (digit: string) => {
      if (isLocked || pin.length >= PIN_LENGTH) return;

      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      // PIN 입력 완료
      if (newPin.length === PIN_LENGTH) {
        await verifyPin(newPin);
      }
    },
    [pin, isLocked]
  );

  // PIN 삭제
  const handleDeletePin = useCallback(() => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError('');
    }
  }, [pin]);

  // PIN 검증
  const verifyPin = async (inputPin: string) => {
    try {
      const isValid = await authService.verifyPassword(inputPin);

      if (isValid) {
        setAuthenticated(true);
      } else {
        handleFailedAttempt();
      }
    } catch (error) {
      handleFailedAttempt();
    }
  };

  // 실패 처리
  const handleFailedAttempt = () => {
    Vibration.vibrate(200);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setPin('');

    if (newAttempts >= MAX_ATTEMPTS) {
      // 잠금
      setIsLocked(true);
      setLockEndTime(Date.now() + LOCK_DURATION_MS);
      setError(`${MAX_ATTEMPTS}회 실패. ${LOCK_DURATION_MS / 1000}초 후 다시 시도하세요.`);
    } else {
      setError(
        `비밀번호가 올바르지 않습니다 (${newAttempts}/${MAX_ATTEMPTS})`
      );
    }
  };

  // 생체인식 인증
  const handleBiometricAuth = async () => {
    try {
      const success = await authService.authenticateWithBiometric();
      if (success) {
        setAuthenticated(true);
      }
    } catch (error) {
      console.log('Biometric auth failed:', error);
    }
  };

  // 비밀번호 설정 화면으로 이동
  const handleSetupPassword = () => {
    navigation.navigate('SetupPassword');
  };

  // 나중에 설정하기
  const handleSkipSetup = () => {
    Alert.alert(
      '비밀번호 설정 건너뛰기',
      '비밀번호 없이 앱을 사용하면 데이터가 보호되지 않습니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '건너뛰기',
          onPress: () => setAuthenticated(true),
          style: 'destructive',
        },
      ]
    );
  };

  // 로딩 중
  if (isLoading) {
    return (
      <SafeContainer>
        <View style={styles.container}>
          <Text style={[styles.title, { color: colors.text }]}>로딩 중...</Text>
        </View>
      </SafeContainer>
    );
  }

  // 비밀번호 미설정 상태
  if (!isPasswordSet) {
    return (
      <SafeContainer>
        <View style={styles.container}>
          <Text style={[styles.emoji]}>📖</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            성경앱에 오신 것을 환영합니다
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            앱을 보호하기 위해 비밀번호를 설정해주세요
          </Text>

          <TouchableOpacity
            style={[styles.setupButton, { backgroundColor: colors.primary }]}
            onPress={handleSetupPassword}
          >
            <Text style={styles.setupButtonText}>비밀번호 설정하기</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkipSetup}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>
              나중에 설정하기
            </Text>
          </TouchableOpacity>
        </View>
      </SafeContainer>
    );
  }

  // 잠금 화면
  return (
    <SafeContainer>
      <View style={styles.container}>
        <Text style={[styles.emoji]}>📖</Text>
        <Text style={[styles.title, { color: colors.text }]}>Bible App</Text>

        {/* PIN 표시 */}
        <View style={styles.pinContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                {
                  backgroundColor:
                    index < pin.length ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* 에러 메시지 */}
        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        ) : isLocked ? (
          <Text style={[styles.lockText, { color: colors.error }]}>
            {remainingTime}초 후 다시 시도하세요
          </Text>
        ) : (
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            비밀번호를 입력해주세요
          </Text>
        )}

        {/* 숫자 키패드 */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'del'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.keypadButton,
                    {
                      backgroundColor:
                        key === '' ? 'transparent' : colors.surface,
                    },
                  ]}
                  onPress={() => {
                    if (key === 'del') {
                      handleDeletePin();
                    } else if (key !== '') {
                      handlePinInput(key);
                    }
                  }}
                  disabled={isLocked || key === ''}
                >
                  <Text
                    style={[
                      styles.keypadText,
                      {
                        color:
                          key === 'del' ? colors.textSecondary : colors.text,
                      },
                    ]}
                  >
                    {key === 'del' ? '⌫' : key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* 생체인식 버튼 */}
        {isBiometricAvailable && isBiometricEnabled && !isLocked && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
          >
            <Text style={[styles.biometricText, { color: colors.primary }]}>
              생체인식으로 잠금해제
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  pinContainer: {
    flexDirection: 'row',
    marginVertical: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  lockText: {
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 14,
    marginBottom: 16,
  },
  keypad: {
    marginTop: 16,
  },
  keypadRow: {
    flexDirection: 'row',
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  keypadText: {
    fontSize: 28,
    fontWeight: '500',
  },
  biometricButton: {
    marginTop: 24,
    padding: 12,
  },
  biometricText: {
    fontSize: 16,
  },
  setupButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    marginTop: 8,
  },
});
