import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { Input, Button, CustomHeader } from '../../components/common';
import { SafeContainer } from '../../components/layout';
import { authService } from '../../services';

type Props = NativeStackScreenProps<SettingsStackParamList, 'PasswordChange'>;

export function PasswordChangeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async () => {
    // 현재 비밀번호 확인
    if (currentPassword.length !== 6) {
      setError('현재 비밀번호를 입력해주세요');
      return;
    }

    // 새 비밀번호 유효성 검사
    if (newPassword.length !== 6 || !/^\d+$/.test(newPassword)) {
      setError('새 비밀번호는 6자리 숫자여야 합니다');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다');
      return;
    }

    setIsLoading(true);
    try {
      // 현재 비밀번호 검증
      const isValid = await authService.verifyPassword(currentPassword);
      if (!isValid) {
        setError('현재 비밀번호가 올바르지 않습니다');
        setIsLoading(false);
        return;
      }

      // 새 비밀번호 저장
      await authService.setPassword(newPassword);
      Alert.alert('완료', '비밀번호가 변경되었습니다', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Error changing password:', err);
      Alert.alert('오류', '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeContainer edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          비밀번호는 6자리 숫자입니다
        </Text>
        <Input
          label="현재 비밀번호"
          placeholder="현재 비밀번호 6자리"
          value={currentPassword}
          onChangeText={(text) => {
            const numOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
            setCurrentPassword(numOnly);
            setError('');
          }}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
        />
        <Input
          label="새 비밀번호"
          placeholder="새 비밀번호 6자리"
          value={newPassword}
          onChangeText={(text) => {
            const numOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
            setNewPassword(numOnly);
            setError('');
          }}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
        />
        <Input
          label="새 비밀번호 확인"
          placeholder="새 비밀번호 다시 입력"
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
        />
        <Button
          title={isLoading ? '변경 중...' : '비밀번호 변경'}
          onPress={handleChange}
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
    padding: 16,
  },
  hint: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
});
