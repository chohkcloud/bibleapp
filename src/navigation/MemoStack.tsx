import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MemoStackParamList } from './types';
import { MemoListScreen } from '../screens/memo/MemoListScreen';
import { MemoDetailScreen } from '../screens/memo/MemoDetailScreen';
import { MemoEditScreen } from '../screens/memo/MemoEditScreen';
import { AnalyticsScreen } from '../screens/memo/AnalyticsScreen';
import { VerseHistoryScreen } from '../screens/memo/VerseHistoryScreen';

const Stack = createNativeStackNavigator<MemoStackParamList>();

export function MemoStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MemoList" component={MemoListScreen} />
      <Stack.Screen name="MemoDetail" component={MemoDetailScreen} />
      <Stack.Screen name="MemoEdit" component={MemoEditScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="VerseHistory" component={VerseHistoryScreen} />
    </Stack.Navigator>
  );
}
