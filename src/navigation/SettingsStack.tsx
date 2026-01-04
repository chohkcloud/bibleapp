import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from './types';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { PasswordChangeScreen } from '../screens/settings/PasswordChangeScreen';
import { FontSizeScreen } from '../screens/settings/FontSizeScreen';
import { AboutScreen } from '../screens/settings/AboutScreen';
import { BibleVersionScreen } from '../screens/settings/BibleVersionScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
      <Stack.Screen name="FontSize" component={FontSizeScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="BibleVersion" component={BibleVersionScreen} />
    </Stack.Navigator>
  );
}
