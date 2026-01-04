// src/services/database/settingsQueries.ts
// 설정 관련 쿼리 함수

import { databaseService } from './index';
import type { Setting } from '../../types/database';

// 현재 시간 ISO 문자열
function getCurrentISOTime(): string {
  return new Date().toISOString();
}

// ============================================
// 설정 키 상수
// ============================================

export const SETTING_KEYS = {
  THEME: 'theme',
  FONT_SIZE: 'font_size',
  DEFAULT_BIBLE: 'default_bible',
  LANGUAGE: 'language',
  AUTO_LOCK_MINUTES: 'auto_lock_minutes',
} as const;

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];

// ============================================
// 설정 CRUD
// ============================================

/**
 * 설정 값 조회
 */
export async function getSetting(key: SettingKey): Promise<string | null> {
  const db = databaseService.getUserDb();
  const result = await db.getFirstAsync<Setting>(
    'SELECT * FROM settings WHERE key = ?',
    [key]
  );
  return result?.value ?? null;
}

/**
 * 설정 값 저장/업데이트
 */
export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const db = databaseService.getUserDb();
  const now = getCurrentISOTime();

  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
    [key, value, now, value, now]
  );
}

/**
 * 모든 설정 조회
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const db = databaseService.getUserDb();
  const results = await db.getAllAsync<Setting>('SELECT * FROM settings');

  const settings: Record<string, string> = {};
  for (const item of results) {
    settings[item.key] = item.value;
  }

  return settings;
}

/**
 * 설정 삭제
 */
export async function deleteSetting(key: SettingKey): Promise<void> {
  const db = databaseService.getUserDb();
  await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
}

// ============================================
// 편의 함수
// ============================================

/**
 * 테마 조회
 */
export async function getTheme(): Promise<'light' | 'dark'> {
  const value = await getSetting(SETTING_KEYS.THEME);
  return (value as 'light' | 'dark') ?? 'light';
}

/**
 * 테마 설정
 */
export async function setTheme(theme: 'light' | 'dark'): Promise<void> {
  await setSetting(SETTING_KEYS.THEME, theme);
}

/**
 * 폰트 크기 조회
 */
export async function getFontSize(): Promise<number> {
  const value = await getSetting(SETTING_KEYS.FONT_SIZE);
  return value ? parseInt(value, 10) : 16;
}

/**
 * 폰트 크기 설정
 */
export async function setFontSize(size: number): Promise<void> {
  await setSetting(SETTING_KEYS.FONT_SIZE, size.toString());
}

/**
 * 기본 성경 버전 조회
 */
export async function getDefaultBible(): Promise<string> {
  const value = await getSetting(SETTING_KEYS.DEFAULT_BIBLE);
  return value ?? 'KRV';
}

/**
 * 기본 성경 버전 설정
 */
export async function setDefaultBible(bibleId: string): Promise<void> {
  await setSetting(SETTING_KEYS.DEFAULT_BIBLE, bibleId);
}

/**
 * 언어 조회
 */
export async function getLanguage(): Promise<string> {
  const value = await getSetting(SETTING_KEYS.LANGUAGE);
  return value ?? 'ko';
}

/**
 * 언어 설정
 */
export async function setLanguage(langId: string): Promise<void> {
  await setSetting(SETTING_KEYS.LANGUAGE, langId);
}

/**
 * 자동 잠금 시간 조회 (분)
 */
export async function getAutoLockMinutes(): Promise<number> {
  const value = await getSetting(SETTING_KEYS.AUTO_LOCK_MINUTES);
  return value ? parseInt(value, 10) : 5;
}

/**
 * 자동 잠금 시간 설정 (분)
 */
export async function setAutoLockMinutes(minutes: number): Promise<void> {
  await setSetting(SETTING_KEYS.AUTO_LOCK_MINUTES, minutes.toString());
}
