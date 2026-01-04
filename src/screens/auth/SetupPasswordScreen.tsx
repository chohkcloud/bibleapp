import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store';
import { Button, Input } from '../../components/common';
import { SafeContainer } from '../../components/layout';
import { authService } from '../../services';

type Props = NativeStackScreenProps<AuthStackParamList, 'SetupPassword'>;

export function SetupPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { setPasswordSet, setAuthenticated } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetPassword = async () => {
    // 유효성 검사
    if (password.length !== 6 || !/^\d+$/.test(password)) {
      setError('비밀번호는 6자리 숫자여야 합니다');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsLoading(true);
    try {
      // authService를 통해 비밀번호 저장
      await authService.setPassword(password);
      setPasswordSet(true);
      setAuthenticated(true);
      Alert.alert('완료', '비밀번호가 설정되었습니다.');
    } catch (err) {
      console.error('Error setting password:', err);
      Alert.alert('오류', '비밀번호 설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeContainer>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          비밀번호 설정
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          앱 잠금에 사용할 비밀번호를 입력해주세요
        </Text>
        <Input
          placeholder="6자리 숫자 비밀번호"
          value={password}
          onChangeText={(text) => {
            // 숫자만 허용, 최대 6자리
            const numOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
            setPassword(numOnly);
            setError('');
          }}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          containerStyle={styles.input}
        />
        <Input
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChangeText={(text) => {
            const numOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
            setConfirmPassword(numOnly);
            setError('');
          }}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          error={error}
          containerStyle={styles.input}
        />
        <Button
          title={isLoading ? '설정 중...' : '비밀번호 설정'}
          onPress={handleSetPassword}
          disabled={isLoading}
          style={styles.button}
        />
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
});
