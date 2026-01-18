import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BibleState {
  currentBible: string;
  currentBook: number;
  currentChapter: number;
  currentVerse: number | null;
  lastReadAt: string | null;
  setBible: (bible: string) => void;
  setBook: (book: number) => void;
  setChapter: (chapter: number) => void;
  setCurrentBook: (book: number) => void;
  setCurrentChapter: (chapter: number) => void;
  setVerse: (verse: number | null) => void;
  setPosition: (book: number, chapter: number, verse?: number) => void;
}

export const useBibleStore = create<BibleState>()(
  persist(
    (set) => ({
      currentBible: 'KRV',
      currentBook: 1,
      currentChapter: 1,
      currentVerse: null,
      lastReadAt: null,
      setBible: (bible) => set({ currentBible: bible }),
      setBook: (book) => set({
        currentBook: book,
        currentChapter: 1,
        currentVerse: null,
        lastReadAt: new Date().toISOString()
      }),
      setChapter: (chapter) => set({
        currentChapter: chapter,
        currentVerse: null,
        lastReadAt: new Date().toISOString()
      }),
      setCurrentBook: (book) => set({
        currentBook: book,
        lastReadAt: new Date().toISOString()
      }),
      setCurrentChapter: (chapter) => set({
        currentChapter: chapter,
        lastReadAt: new Date().toISOString()
      }),
      setVerse: (verse) => set({ currentVerse: verse }),
      setPosition: (book, chapter, verse) => set({
        currentBook: book,
        currentChapter: chapter,
        currentVerse: verse ?? null,
        lastReadAt: new Date().toISOString()
      }),
    }),
    {
      name: 'bible-app-reading-position',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
