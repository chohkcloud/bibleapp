import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';
type Language = 'ko' | 'en' | 'ja';

interface SettingsState {
  // 기존 설정
  fontSize: number;
  themeMode: ThemeMode;
  language: Language;
  bibleVersion: string;
  autoLockEnabled: boolean;
  autoLockTimeout: number;

  // 다중 버전 지원 추가
  downloadedVersions: string[];
  preferredVersionByLang: Record<string, string>;

  // 기존 액션
  setFontSize: (size: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  setBibleVersion: (version: string) => void;
  setAutoLockEnabled: (enabled: boolean) => void;
  setAutoLockTimeout: (timeout: number) => void;

  // 다중 버전 액션
  addDownloadedVersion: (versionId: string) => void;
  removeDownloadedVersion: (versionId: string) => void;
  setPreferredVersion: (langId: string, versionId: string) => void;
  getPreferredVersion: (langId: string) => string | undefined;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // 기존 설정
      fontSize: 16,
      themeMode: 'light',
      language: 'ko',
      bibleVersion: 'KRV',
      autoLockEnabled: true,
      autoLockTimeout: 60000,

      // 다중 버전 지원 추가
      downloadedVersions: ['KRV'], // 기본 번들 버전
      preferredVersionByLang: { ko: 'KRV' },

      // 기존 액션
      setFontSize: (size) => set({ fontSize: size }),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setLanguage: (lang) => set({ language: lang }),
      setBibleVersion: (version) => set({ bibleVersion: version }),
      setAutoLockEnabled: (enabled) => set({ autoLockEnabled: enabled }),
      setAutoLockTimeout: (timeout) => set({ autoLockTimeout: timeout }),

      // 다중 버전 액션
      addDownloadedVersion: (versionId) =>
        set((state) => ({
          downloadedVersions: state.downloadedVersions.includes(versionId)
            ? state.downloadedVersions
            : [...state.downloadedVersions, versionId],
        })),

      removeDownloadedVersion: (versionId) =>
        set((state) => ({
          downloadedVersions: state.downloadedVersions.filter((id) => id !== versionId),
        })),

      setPreferredVersion: (langId, versionId) =>
        set((state) => ({
          preferredVersionByLang: {
            ...state.preferredVersionByLang,
            [langId]: versionId,
          },
        })),

      getPreferredVersion: (langId) => {
        return get().preferredVersionByLang[langId];
      },
    }),
    {
      name: 'bible-app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
