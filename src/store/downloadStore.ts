// src/store/downloadStore.ts
// 다운로드 진행 상태 관리 스토어

import { create } from 'zustand';
import type { DownloadProgress, DownloadStatus } from '../types/database';

interface DownloadState {
  // 현재 진행 중인 다운로드
  activeDownloads: Record<string, DownloadProgress>;

  // 액션
  startDownload: (versionId: string, totalBytes: number) => void;
  updateProgress: (versionId: string, progress: Partial<DownloadProgress>) => void;
  completeDownload: (versionId: string) => void;
  failDownload: (versionId: string, error: string) => void;
  cancelDownload: (versionId: string) => void;
  clearDownload: (versionId: string) => void;
  clearAllDownloads: () => void;

  // 조회
  getDownloadProgress: (versionId: string) => DownloadProgress | undefined;
  isDownloading: (versionId: string) => boolean;
  hasActiveDownloads: () => boolean;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  activeDownloads: {},

  startDownload: (versionId: string, totalBytes: number) => {
    set((state) => ({
      activeDownloads: {
        ...state.activeDownloads,
        [versionId]: {
          versionId,
          progress: 0,
          downloadedBytes: 0,
          totalBytes,
          status: 'pending',
        },
      },
    }));
  },

  updateProgress: (versionId: string, progress: Partial<DownloadProgress>) => {
    set((state) => {
      const current = state.activeDownloads[versionId];
      if (!current) return state;

      return {
        activeDownloads: {
          ...state.activeDownloads,
          [versionId]: {
            ...current,
            ...progress,
          },
        },
      };
    });
  },

  completeDownload: (versionId: string) => {
    set((state) => {
      const current = state.activeDownloads[versionId];
      if (!current) return state;

      return {
        activeDownloads: {
          ...state.activeDownloads,
          [versionId]: {
            ...current,
            progress: 100,
            status: 'completed',
          },
        },
      };
    });
  },

  failDownload: (versionId: string, error: string) => {
    set((state) => {
      const current = state.activeDownloads[versionId];
      if (!current) return state;

      return {
        activeDownloads: {
          ...state.activeDownloads,
          [versionId]: {
            ...current,
            status: 'error',
            error,
          },
        },
      };
    });
  },

  cancelDownload: (versionId: string) => {
    set((state) => {
      const current = state.activeDownloads[versionId];
      if (!current) return state;

      return {
        activeDownloads: {
          ...state.activeDownloads,
          [versionId]: {
            ...current,
            status: 'cancelled',
          },
        },
      };
    });
  },

  clearDownload: (versionId: string) => {
    set((state) => {
      const { [versionId]: _, ...rest } = state.activeDownloads;
      return { activeDownloads: rest };
    });
  },

  clearAllDownloads: () => {
    set({ activeDownloads: {} });
  },

  getDownloadProgress: (versionId: string) => {
    return get().activeDownloads[versionId];
  },

  isDownloading: (versionId: string) => {
    const progress = get().activeDownloads[versionId];
    return progress?.status === 'downloading' || progress?.status === 'processing';
  },

  hasActiveDownloads: () => {
    const downloads = get().activeDownloads;
    return Object.values(downloads).some(
      (d) => d.status === 'downloading' || d.status === 'processing'
    );
  },
}));
