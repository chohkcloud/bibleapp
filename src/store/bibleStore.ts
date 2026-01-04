import { create } from 'zustand';

interface BibleState {
  currentBible: string;
  currentBook: number;
  currentChapter: number;
  currentVerse: number | null;
  setBible: (bible: string) => void;
  setBook: (book: number) => void;
  setChapter: (chapter: number) => void;
  setCurrentBook: (book: number) => void;
  setCurrentChapter: (chapter: number) => void;
  setVerse: (verse: number | null) => void;
  setPosition: (book: number, chapter: number, verse?: number) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  currentBible: 'KRV',
  currentBook: 1,
  currentChapter: 1,
  currentVerse: null,
  setBible: (bible) => set({ currentBible: bible }),
  setBook: (book) => set({ currentBook: book, currentChapter: 1, currentVerse: null }),
  setChapter: (chapter) => set({ currentChapter: chapter, currentVerse: null }),
  setCurrentBook: (book) => set({ currentBook: book }),
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setVerse: (verse) => set({ currentVerse: verse }),
  setPosition: (book, chapter, verse) => set({
    currentBook: book,
    currentChapter: chapter,
    currentVerse: verse ?? null
  }),
}));
