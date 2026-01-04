import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppProviders } from './AppProviders';
import { RootNavigator } from '../navigation';
import { Loading } from '../components/common';
import { databaseService } from '../services';

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // 데이터베이스 초기화
        await databaseService.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('[App] 초기화 실패:', error);
        setInitError(error instanceof Error ? error.message : '초기화 중 오류가 발생했습니다.');
      }
    }
    initialize();
  }, []);

  // 로딩 중
  if (!isReady && !initError) {
    return <Loading message="앱을 초기화하는 중..." />;
  }

  // 초기화 오류
  if (initError) {
    return <Loading message={`오류: ${initError}`} />;
  }

  return (
    <>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </SafeAreaProvider>
  );
}
