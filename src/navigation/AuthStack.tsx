import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { LockScreen } from '../screens/auth/LockScreen';
import { SetupPasswordScreen } from '../screens/auth/SetupPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Lock" component={LockScreen} />
      <Stack.Screen name="SetupPassword" component={SetupPasswordScreen} />
    </Stack.Navigator>
  );
}
