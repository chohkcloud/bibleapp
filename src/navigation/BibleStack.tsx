import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BibleStackParamList } from './types';
import { BibleScreen } from '../screens/bible/BibleScreen';
import { ChapterSelectScreen } from '../screens/bible/ChapterSelectScreen';
import { ReadingScreen } from '../screens/bible/ReadingScreen';
import { ShareScreen } from '../screens/share/ShareScreen';

const Stack = createNativeStackNavigator<BibleStackParamList>();

export function BibleStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Bible" component={BibleScreen} />
      <Stack.Screen name="ChapterSelect" component={ChapterSelectScreen} />
      <Stack.Screen name="Reading" component={ReadingScreen} />
      <Stack.Screen name="Share" component={ShareScreen} />
    </Stack.Navigator>
  );
}
