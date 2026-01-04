# 프로젝트 구조 (PROJECT_STRUCTURE.md)

## 폴더 구조

```
bible-app/
├── app.json                    # Expo 설정
├── package.json
├── tsconfig.json
├── babel.config.js
├── .env                        # 환경변수 (gitignore)
│
├── assets/
│   ├── database/
│   │   └── bible.db            # 사전 빌드된 성경 DB
│   ├── fonts/
│   │   ├── Pretendard-Regular.otf
│   │   ├── Pretendard-Medium.otf
│   │   └── Pretendard-Bold.otf
│   ├── images/
│   │   ├── icon.png
│   │   ├── splash.png
│   │   └── adaptive-icon.png
│   └── share-templates/        # 공유 카드 템플릿 이미지
│       ├── template-default.png
│       ├── template-minimal.png
│       └── template-classic.png
│
├── src/
│   ├── app/                    # 앱 진입점
│   │   ├── App.tsx             # 메인 앱 컴포넌트
│   │   └── AppProviders.tsx    # Context Providers 래퍼
│   │
│   ├── navigation/             # 네비게이션
│   │   ├── index.tsx           # 루트 네비게이터
│   │   ├── types.ts            # 네비게이션 타입
│   │   ├── AuthStack.tsx
│   │   ├── MainTabs.tsx
│   │   ├── BibleStack.tsx
│   │   ├── MemoStack.tsx
│   │   ├── SearchStack.tsx
│   │   └── SettingsStack.tsx
│   │
│   ├── screens/                # 화면 컴포넌트
│   │   ├── auth/
│   │   │   ├── LockScreen.tsx
│   │   │   └── SetupPasswordScreen.tsx
│   │   │
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   │
│   │   ├── bible/
│   │   │   ├── BibleScreen.tsx         # 책 목록
│   │   │   ├── ChapterSelectScreen.tsx # 장 선택
│   │   │   └── ReadingScreen.tsx       # 성경 읽기
│   │   │
│   │   ├── search/
│   │   │   ├── SearchScreen.tsx
│   │   │   └── SearchResultScreen.tsx
│   │   │
│   │   ├── memo/
│   │   │   ├── MemoListScreen.tsx
│   │   │   ├── MemoDetailScreen.tsx
│   │   │   ├── MemoEditScreen.tsx
│   │   │   ├── AnalyticsScreen.tsx
│   │   │   └── VerseHistoryScreen.tsx
│   │   │
│   │   ├── share/
│   │   │   └── ShareScreen.tsx
│   │   │
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       ├── PasswordChangeScreen.tsx
│   │       ├── FontSizeScreen.tsx
│   │       └── AboutScreen.tsx
│   │
│   ├── components/             # 재사용 컴포넌트
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ActionSheet.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── PinInput.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── SafeContainer.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── bible/
│   │   │   ├── VerseItem.tsx
│   │   │   ├── VerseList.tsx
│   │   │   ├── BookList.tsx
│   │   │   ├── BookItem.tsx
│   │   │   ├── ChapterGrid.tsx
│   │   │   ├── BibleVersionPicker.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── memo/
│   │   │   ├── MemoCard.tsx
│   │   │   ├── MemoList.tsx
│   │   │   ├── MemoEditor.tsx
│   │   │   ├── TagSelector.tsx
│   │   │   ├── TagChip.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── StatCard.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── TopVersesList.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── share/
│   │   │   ├── ShareCard.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts            # 모든 컴포넌트 export
│   │
│   ├── services/               # 비즈니스 로직
│   │   ├── database/
│   │   │   ├── index.ts        # DatabaseService 클래스
│   │   │   ├── bibleQueries.ts # 성경 관련 쿼리
│   │   │   ├── memoQueries.ts  # 메모 관련 쿼리
│   │   │   └── settingsQueries.ts
│   │   │
│   │   ├── bibleService.ts     # 성경 조회, 검색
│   │   ├── memoService.ts      # 메모 CRUD
│   │   ├── analyticsService.ts # 통계 분석
│   │   ├── shareService.ts     # 이미지 생성, 공유
│   │   ├── authService.ts      # 인증, 비밀번호
│   │   └── index.ts
│   │
│   ├── hooks/                  # 커스텀 훅
│   │   ├── useBible.ts         # 성경 데이터 훅
│   │   ├── useSearch.ts        # 검색 훅
│   │   ├── useMemo.ts          # 메모 훅
│   │   ├── useAnalytics.ts     # 통계 훅
│   │   ├── useAuth.ts          # 인증 훅
│   │   ├── useShare.ts         # 공유 훅
│   │   ├── useSettings.ts      # 설정 훅
│   │   └── index.ts
│   │
│   ├── store/                  # 상태 관리 (Zustand)
│   │   ├── index.ts            # 스토어 생성
│   │   ├── authStore.ts
│   │   ├── bibleStore.ts
│   │   ├── memoStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── utils/                  # 유틸리티
│   │   ├── crypto.ts           # 암호화/복호화
│   │   ├── format.ts           # 날짜, 텍스트 포맷
│   │   ├── validation.ts       # 입력 검증
│   │   ├── storage.ts          # SecureStore 래퍼
│   │   ├── uuid.ts             # UUID 생성
│   │   └── constants.ts        # 상수 정의
│   │
│   ├── types/                  # TypeScript 타입
│   │   ├── database.ts         # DB 엔티티 타입
│   │   ├── navigation.ts       # 네비게이션 타입
│   │   ├── api.ts              # API 응답 타입
│   │   └── index.ts
│   │
│   └── theme/                  # 테마 설정
│       ├── index.ts
│       ├── colors.ts
│       ├── spacing.ts
│       ├── typography.ts
│       └── ThemeContext.tsx
│
└── __tests__/                  # 테스트
    ├── services/
    ├── hooks/
    └── components/
```

---

## 핵심 파일 템플릿

### App.tsx

```typescript
// src/app/App.tsx

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProviders } from './AppProviders';
import { RootNavigator } from '../navigation';
import { databaseService } from '../services/database';
import { Loading } from '../components/common';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        await databaseService.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Initialization failed:', error);
      }
    }
    initialize();
  }, []);

  if (!isReady) {
    return <Loading message="앱을 초기화하는 중..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### AppProviders.tsx

```typescript
// src/app/AppProviders.tsx

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../theme/ThemeContext';

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
```

### RootNavigator

```typescript
// src/navigation/index.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}
```

### MainTabs

```typescript
// src/navigation/MainTabs.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/home/HomeScreen';
import { BibleStack } from './BibleStack';
import { SearchStack } from './SearchStack';
import { MemoStack } from './MemoStack';
import { SettingsStack } from './SettingsStack';
import { MainTabParamList } from './types';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

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
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'BibleTab':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'SearchTab':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'MemoTab':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'SettingsTab':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

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
        options={{ tabBarLabel: '메모' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStack} 
        options={{ tabBarLabel: '설정' }}
      />
    </Tab.Navigator>
  );
}
```

### Zustand Store

```typescript
// src/store/index.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  
  // Bible
  currentBible: string;
  currentBook: number;
  currentChapter: number;
  setBible: (bible: string) => void;
  setBook: (book: number) => void;
  setChapter: (chapter: number) => void;
  
  // Settings
  fontSize: number;
  theme: 'light' | 'dark';
  language: 'ko' | 'en' | 'ja';
  setFontSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'ko' | 'en' | 'ja') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      isAuthenticated: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      
      // Bible
      currentBible: 'KRV',
      currentBook: 1,
      currentChapter: 1,
      setBible: (bible) => set({ currentBible: bible }),
      setBook: (book) => set({ currentBook: book }),
      setChapter: (chapter) => set({ currentChapter: chapter }),
      
      // Settings
      fontSize: 16,
      theme: 'light',
      language: 'ko',
      setFontSize: (size) => set({ fontSize: size }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'bible-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentBible: state.currentBible,
        fontSize: state.fontSize,
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
```

---

## package.json

```json
{
  "name": "bible-app",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "date-fns": "^3.0.0",
    "expo": "~50.0.0",
    "expo-crypto": "~12.0.0",
    "expo-file-system": "~16.0.0",
    "expo-local-authentication": "~13.0.0",
    "expo-secure-store": "~12.0.0",
    "expo-sharing": "~11.0.0",
    "expo-sqlite": "~13.0.0",
    "expo-status-bar": "~1.11.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "react-native-view-shot": "^3.8.0",
    "zustand": "^4.4.0",
    "@react-native-async-storage/async-storage": "1.21.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "typescript": "^5.3.0"
  },
  "private": true
}
```

---

## tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@store/*": ["src/store/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@theme/*": ["src/theme/*"],
      "@navigation/*": ["src/navigation/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## babel.config.js

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@theme': './src/theme',
            '@navigation': './src/navigation',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```
