/**
 * Choco AI Configuration
 * 서버 URL, API Key 관리, 타임아웃 설정
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ChocoAIConfig } from './chocoAITypes';

// ============================================
// Environment Configuration
// ============================================

export type Environment = 'development' | 'production';

export const getCurrentEnvironment = (): Environment => {
  return __DEV__ ? 'development' : 'production';
};

// ============================================
// Server URL Configuration
// ============================================

const SERVER_URLS: Record<Environment, string> = {
  development: Platform.OS === 'android' ? 'http://10.0.2.2:9090' : 'http://192.168.219.104:9090',
  production: 'http://192.168.219.104:9090',  // 같은 네트워크 내에서 사용
};

export const getServerUrl = (): string => {
  return SERVER_URLS[getCurrentEnvironment()];
};

let customServerUrl: string | null = null;

export const setCustomServerUrl = (url: string | null): void => {
  customServerUrl = url;
};

export const getActiveServerUrl = (): string => {
  return customServerUrl || getServerUrl();
};

// ============================================
// API Key Management (expo-secure-store)
// ============================================

const SECURE_STORE_KEY = 'choco_api_key';

export const saveApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, apiKey);
    return true;
  } catch (error) {
    console.error('[ChocoAI] API Key 저장 실패:', error);
    return false;
  }
};

export const getApiKey = async (): Promise<string | null> => {
  try {
    const apiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    return apiKey;
  } catch (error) {
    console.error('[ChocoAI] API Key 불러오기 실패:', error);
    return null;
  }
};

export const deleteApiKey = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    return true;
  } catch (error) {
    console.error('[ChocoAI] API Key 삭제 실패:', error);
    return false;
  }
};

export const hasApiKey = async (): Promise<boolean> => {
  const apiKey = await getApiKey();
  return apiKey !== null && apiKey.length > 0;
};

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_CONFIG: ChocoAIConfig = {
  serverUrl: getServerUrl(),
  apiKey: '',
  model: 'llama3.2',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

export const getConfig = async (): Promise<ChocoAIConfig> => {
  const apiKey = await getApiKey();
  return {
    ...DEFAULT_CONFIG,
    serverUrl: getActiveServerUrl(),
    apiKey: apiKey || '',
  };
};

// ============================================
// Configuration Validation
// ============================================

export const validateConfig = (config: ChocoAIConfig): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!config.serverUrl) {
    errors.push('서버 URL이 설정되지 않았습니다.');
  } else if (!config.serverUrl.startsWith('http://') && !config.serverUrl.startsWith('https://')) {
    errors.push('서버 URL은 http:// 또는 https://로 시작해야 합니다.');
  }

  if (!config.apiKey) {
    errors.push('API Key가 설정되지 않았습니다.');
  } else if (config.apiKey.length < 16) {
    errors.push('API Key가 너무 짧습니다. (최소 16자)');
  }

  if (!config.model) {
    errors.push('모델명이 설정되지 않았습니다.');
  }

  if (config.timeout < 1000) {
    errors.push('타임아웃은 최소 1000ms(1초) 이상이어야 합니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================
// Debug / Development Helpers
// ============================================

export const logCurrentConfig = async (): Promise<void> => {
  if (!__DEV__) return;

  const config = await getConfig();
  const maskedApiKey = config.apiKey
    ? config.apiKey.substring(0, 4) + '****' + config.apiKey.substring(config.apiKey.length - 4)
    : '(not set)';

  console.log('[ChocoAI] Current Configuration:');
  console.log('  - Environment: ' + getCurrentEnvironment());
  console.log('  - Server URL: ' + config.serverUrl);
  console.log('  - API Key: ' + maskedApiKey);
  console.log('  - Model: ' + config.model);
  console.log('  - Timeout: ' + config.timeout + 'ms');
  console.log('  - Max Retries: ' + config.maxRetries);
  console.log('  - Platform: ' + Platform.OS);
};
