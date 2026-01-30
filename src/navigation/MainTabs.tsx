import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BibleStack } from './BibleStack';
import { SearchStack } from './SearchStack';
import { MemoStack } from './MemoStack';
import { SettingsStack } from './SettingsStack';
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

const getTabIcon = (routeName: keyof MainTabParamList, focused: boolean): IconName => {
  const icons: Record<keyof MainTabParamList, { focused: IconName; unfocused: IconName }> = {
    HomeTab: { focused: 'home', unfocused: 'home-outline' },
    BibleTab: { focused: 'book', unfocused: 'book-outline' },
    SearchTab: { focused: 'search', unfocused: 'search-outline' },
    MemoTab: { focused: 'document-text', unfocused: 'document-text-outline' },
    SettingsTab: { focused: 'settings', unfocused: 'settings-outline' },
  };
  return focused ? icons[routeName].focused : icons[routeName].unfocused;
};

export function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabIcon(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: '홈' }}
      />
      <Tab.Screen
        name="BibleTab"
        component={BibleStack}
        options={{ tabBarLabel: '성경' }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{ tabBarLabel: '검색' }}
      />
      <Tab.Screen
        name="MemoTab"
        component={MemoStack}
        options={{ tabBarLabel: 'QT' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{ tabBarLabel: '설정' }}
      />
    </Tab.Navigator>
  );
}
