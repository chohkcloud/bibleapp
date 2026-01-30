/**
 * Choco AI Configuration
 * 서버 URL, API Key 관리, 타임아웃 설정
 */

import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
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

// 내부 네트워크 (WiFi - 같은 공유기)
const INTERNAL_URL = 'http://192.168.219.104:9090';
// 외부 네트워크 (모바일 데이터 - 공인 IP 포트포워딩)
const EXTERNAL_URL = 'http://117.111.123.99:9090';

const SERVER_URLS: Record<Environment, string> = {
  development: Platform.OS === 'android' ? 'http://10.0.2.2:9090' : INTERNAL_URL,
  production: INTERNAL_URL,
};

export const getServerUrl = (): string => {
  return SERVER_URLS[getCurrentEnvironment()];
};

let customServerUrl: string | null = null;

export const setCustomServerUrl = (url: string | null): void => {
  customServerUrl = url;
};

/**
 * 네트워크 상태에 따라 서버 URL 자동 선택
 * - WiFi: 내부 IP (빠름)
 * - 모바일 데이터: 공인 IP (포트포워딩)
 */
export const getNetworkAwareServerUrl = async (): Promise<string> => {
  try {
    const networkState = await Network.getNetworkStateAsync();

    if (networkState.type === Network.NetworkStateType.WIFI) {
      console.log('[ChocoAI] WiFi 감지 → 내부 IP 사용');
      return INTERNAL_URL;
    } else if (networkState.type === Network.NetworkStateType.CELLULAR) {
      console.log('[ChocoAI] 모바일 데이터 감지 → 공인 IP 사용');
      return EXTERNAL_URL;
    }
  } catch (error) {
    console.warn('[ChocoAI] 네트워크 감지 실패, 기본 URL 사용:', error);
  }
  return INTERNAL_URL;
};

export const getActiveServerUrl = (): string => {
  return customServerUrl || getServerUrl();
};

/**
 * 네트워크 상태 기반 활성 URL (비동기)
 * customServerUrl이 설정되어 있으면 그것을 우선 사용
 */
export const getActiveServerUrlAsync = async (): Promise<string> => {
  if (customServerUrl) {
    return customServerUrl;
  }
  return await getNetworkAwareServerUrl();
};

/**
 * 앱 시작 시 저장된 서버 URL 로드
 */
export const initializeServerUrl = async (): Promise<void> => {
  await loadServerUrl();
};

// ============================================
// API Key Management (expo-secure-store)
// ============================================

const SECURE_STORE_KEY = 'choco_api_key';
const SERVER_URL_KEY = 'choco_server_url';

// ============================================
// Server URL Persistence
// ============================================

export const saveServerUrl = async (url: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(SERVER_URL_KEY, url);
    customServerUrl = url;  // 메모리에도 반영
    return true;
  } catch (error) {
    console.error('[ChocoAI] Server URL 저장 실패:', error);
    return false;
  }
};

export const loadServerUrl = async (): Promise<string | null> => {
  try {
    const url = await SecureStore.getItemAsync(SERVER_URL_KEY);
    if (url) {
      customServerUrl = url;  // 메모리에 반영
    }
    return url;
  } catch (error) {
    console.error('[ChocoAI] Server URL 불러오기 실패:', error);
    return null;
  }
};

export const deleteServerUrl = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(SERVER_URL_KEY);
    customServerUrl = null;
    return true;
  } catch (error) {
    console.error('[ChocoAI] Server URL 삭제 실패:', error);
    return false;
  }
};

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
  const [apiKey, serverUrl] = await Promise.all([
    getApiKey(),
    getActiveServerUrlAsync(),
  ]);
  return {
    ...DEFAULT_CONFIG,
    serverUrl,
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
