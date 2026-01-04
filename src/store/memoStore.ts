import { create } from 'zustand';

export interface Memo {
  id: string;
  verseId: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface MemoState {
  memos: Memo[];
  selectedMemo: Memo | null;
  isLoading: boolean;
  setMemos: (memos: Memo[]) => void;
  addMemo: (memo: Memo) => void;
  updateMemo: (id: string, updates: Partial<Memo>) => void;
  deleteMemo: (id: string) => void;
  setSelectedMemo: (memo: Memo | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useMemoStore = create<MemoState>((set) => ({
  memos: [],
  selectedMemo: null,
  isLoading: false,
  setMemos: (memos) => set({ memos }),
  addMemo: (memo) => set((state) => ({ memos: [memo, ...state.memos] })),
  updateMemo: (id, updates) => set((state) => ({
    memos: state.memos.map((m) => m.id === id ? { ...m, ...updates } : m),
  })),
  deleteMemo: (id) => set((state) => ({
    memos: state.memos.filter((m) => m.id !== id),
  })),
  setSelectedMemo: (memo) => set({ selectedMemo: memo }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
