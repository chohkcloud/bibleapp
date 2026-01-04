// src/services/shareService.web.ts
// 공유 서비스 (웹 전용)

import { RefObject } from 'react';
import { View } from 'react-native';
import type { Verse, Memo } from '../types/database';

export type ShareTemplate = 'default' | 'minimal' | 'classic' | 'dark';
export type ShareTarget = 'kakaotalk' | 'email' | 'other';

export interface ShareCardData {
  reference: string;
  verseText: string;
  memoContent?: string;
  template: ShareTemplate;
  backgroundColor: string;
}

export interface ShareResult {
  success: boolean;
  error?: string;
}

const TEMPLATE_COLORS: Record<ShareTemplate, string> = {
  default: '#FFFFFF',
  minimal: '#F5F5F5',
  classic: '#FEF3C7',
  dark: '#1F2937',
};

class ShareService {
  async generateImage(viewRef: RefObject<View>): Promise<string> {
    return '';
  }

  async shareImage(imageUri: string): Promise<ShareResult> {
    return { success: false, error: 'Not supported on web' };
  }

  async shareText(text: string): Promise<ShareResult> {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return { success: true };
      } catch {
        return { success: false };
      }
    }
    return { success: false, error: 'Not supported on web' };
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(navigator.share);
  }

  createShareCardData(verse: Verse, bookName: string, memo?: Memo, template: ShareTemplate = 'default', backgroundColor?: string): ShareCardData {
    return {
      reference: bookName + ' ' + verse.chapter + ':' + verse.verse_num,
      verseText: verse.text,
      memoContent: memo?.content,
      template,
      backgroundColor: backgroundColor || TEMPLATE_COLORS[template]
    };
  }

  createShareText(verse: Verse, bookName: string, memo?: Memo): string {
    return bookName + ' ' + verse.chapter + ':' + verse.verse_num + ' - ' + verse.text;
  }

  getTemplateColor(template: ShareTemplate): string {
    return TEMPLATE_COLORS[template];
  }

  getAvailableTemplates(): { id: ShareTemplate; name: string; color: string }[] {
    return [
      { id: 'default', name: 'Default', color: TEMPLATE_COLORS.default },
      { id: 'minimal', name: 'Minimal', color: TEMPLATE_COLORS.minimal },
      { id: 'classic', name: 'Classic', color: TEMPLATE_COLORS.classic },
      { id: 'dark', name: 'Dark', color: TEMPLATE_COLORS.dark },
    ];
  }
}

export const shareService = new ShareService();
