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
  MemoEdit: { memoId?: string; verseId?: string };
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
