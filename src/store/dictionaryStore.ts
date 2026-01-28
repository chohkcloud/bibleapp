import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StrongEntry, DictEntry, SelectedWord } from '../types/dictionary';

interface DictionaryState {
  // 현재 조회 중인 항목
  currentStrongEntry: StrongEntry | null;
  currentDictEntry: DictEntry | null;

  // 선택된 단어 (UI 상태)
  selectedWord: SelectedWord | null;

  // 검색 결과
  strongSearchResults: StrongEntry[];
  dictSearchResults: DictEntry[];

  // 최근 검색/조회 (persist)
  recentSearches: string[];
  recentStrongNums: string[];

  // 즐겨찾기 (persist)
  favoriteStrongNums: string[];
  favoriteDictTerms: string[];

  // 로딩 상태
  isLoading: boolean;
  error: string | null;

  // 비교 성경 설정 (persist)
  parallelVersions: string[];
  showParallel: boolean;

  // Actions
  setCurrentStrongEntry: (entry: StrongEntry | null) => void;
  setCurrentDictEntry: (entry: DictEntry | null) => void;
  setSelectedWord: (word: SelectedWord | null) => void;
  setStrongSearchResults: (results: StrongEntry[]) => void;
  setDictSearchResults: (results: DictEntry[]) => void;
  addRecentSearch: (query: string) => void;
  addRecentStrong: (num: string) => void;
  toggleFavoriteStrong: (num: string) => void;
  toggleFavoriteDictTerm: (term: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearResults: () => void;
  setParallelVersions: (versions: string[]) => void;
  toggleParallel: () => void;
}

export const useDictionaryStore = create<DictionaryState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStrongEntry: null,
      currentDictEntry: null,
      selectedWord: null,
      strongSearchResults: [],
      dictSearchResults: [],
      recentSearches: [],
      recentStrongNums: [],
      favoriteStrongNums: [],
      favoriteDictTerms: [],
      isLoading: false,
      error: null,
      parallelVersions: ['hcv', 'kjv'],
      showParallel: false,

      // Actions
      setCurrentStrongEntry: (entry) => {
        set({ currentStrongEntry: entry });
        if (entry) {
          const { recentStrongNums } = get();
          const filtered = recentStrongNums.filter(n => n !== entry.num);
          set({ recentStrongNums: [entry.num, ...filtered].slice(0, 20) });
        }
      },

      setCurrentDictEntry: (entry) => set({ currentDictEntry: entry }),

      setSelectedWord: (word) => set({ selectedWord: word }),

      setStrongSearchResults: (results) => set({ strongSearchResults: results }),

      setDictSearchResults: (results) => set({ dictSearchResults: results }),

      addRecentSearch: (query) => {
        const { recentSearches } = get();
        const filtered = recentSearches.filter(s => s !== query);
        set({ recentSearches: [query, ...filtered].slice(0, 20) });
      },

      addRecentStrong: (num) => {
        const { recentStrongNums } = get();
        const filtered = recentStrongNums.filter(n => n !== num);
        set({ recentStrongNums: [num, ...filtered].slice(0, 20) });
      },

      toggleFavoriteStrong: (num) => {
        const { favoriteStrongNums } = get();
        if (favoriteStrongNums.includes(num)) {
          set({ favoriteStrongNums: favoriteStrongNums.filter(n => n !== num) });
        } else {
          set({ favoriteStrongNums: [num, ...favoriteStrongNums] });
        }
      },

      toggleFavoriteDictTerm: (term) => {
        const { favoriteDictTerms } = get();
        if (favoriteDictTerms.includes(term)) {
          set({ favoriteDictTerms: favoriteDictTerms.filter(t => t !== term) });
        } else {
          set({ favoriteDictTerms: [term, ...favoriteDictTerms] });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearResults: () => set({
        strongSearchResults: [],
        dictSearchResults: [],
        currentStrongEntry: null,
        currentDictEntry: null,
        error: null,
      }),

      setParallelVersions: (versions) => set({ parallelVersions: versions }),

      toggleParallel: () => set((state) => ({ showParallel: !state.showParallel })),
    }),
    {
      name: 'bible-app-dictionary',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        recentSearches: state.recentSearches,
        recentStrongNums: state.recentStrongNums,
        favoriteStrongNums: state.favoriteStrongNums,
        favoriteDictTerms: state.favoriteDictTerms,
        parallelVersions: state.parallelVersions,
      }),
    }
  )
);
