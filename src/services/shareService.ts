// src/services/shareService.ts
import { Platform } from 'react-native';
import { RefObject } from 'react';
import { View } from 'react-native';
import type { Verse, Memo } from '../types/database';

const isWeb = Platform.OS === 'web';

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
    if (isWeb) { return ''; }
    const { captureRef } = require('react-native-view-shot');
    return await captureRef(viewRef, { format: 'png', quality: 1, result: 'tmpfile' });
  }

  async shareImage(imageUri: string): Promise<ShareResult> {
    if (isWeb) { return { success: false, error: 'Not supported on web' }; }
    const Sharing = require('expo-sharing');
    await Sharing.shareAsync(imageUri, { mimeType: 'image/png' });
    return { success: true };
  }

  async shareText(text: string): Promise<ShareResult> {
    if (isWeb && navigator.share) {
      try { await navigator.share({ text }); return { success: true }; } catch { return { success: false }; }
    }
    if (isWeb) { return { success: false, error: 'Not supported on web' }; }
    const Sharing = require('expo-sharing');
    return { success: true };
  }

  async isAvailable(): Promise<boolean> {
    if (isWeb) { return Boolean(navigator.share); }
    const Sharing = require('expo-sharing');
    return await Sharing.isAvailableAsync();
  }

  createShareCardData(verse: Verse, bookName: string, memo?: Memo, template: ShareTemplate = 'default', backgroundColor?: string): ShareCardData {
    return { reference: bookName + ' ' + verse.chapter + ':' + verse.verse_num, verseText: verse.text, memoContent: memo?.content, template, backgroundColor: backgroundColor || TEMPLATE_COLORS[template] };
  }

  createShareText(verse: Verse, bookName: string, memo?: Memo): string {
    return bookName + ' ' + verse.chapter + ':' + verse.verse_num + ' - ' + verse.text;
  }

  getTemplateColor(template: ShareTemplate): string { return TEMPLATE_COLORS[template]; }

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
