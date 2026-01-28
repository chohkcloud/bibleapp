import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  Lock: undefined;
  SetupPassword: undefined;
};

// Main Tabs
export type MainTabParamList = {
  HomeTab: undefined;
  BibleTab: NavigatorScreenParams<BibleStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  MemoTab: NavigatorScreenParams<MemoStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

// Bible Stack
export type BibleStackParamList = {
  Bible: undefined;
  ChapterSelect: { bookId: number; bookName: string; chapters?: number };
  Reading: { bookId: number; chapter: number };
  Share: { verseId: string; verseText: string };
};

// Search Stack
export type SearchStackParamList = {
  Search: undefined;
  SearchResult: { query: string };
};

// Memo Stack
export type MemoStackParamList = {
  MemoList: undefined;
  MemoDetail: { memoId: string };
  MemoEdit: {
    memoId?: string;
    verseId?: number;        // string → number (버그 수정)
    bookId?: number;         // 책 ID
    chapter?: number;        // 장
    verseRange?: string;     // 다중 구절: "1-16" 또는 "1,3,5-10"
  };
  Analytics: undefined;
  VerseHistory: { verseId: string };
};

// Settings Stack
export type SettingsStackParamList = {
  Settings: undefined;
  PasswordChange: undefined;
  FontSize: undefined;
  About: undefined;
  BibleVersion: undefined;
  ChocoAISettings: undefined;
};
