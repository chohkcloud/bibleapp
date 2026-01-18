/**
 * Choco AI Configuration
 * 서버 URL, API Key 관리, 타임아웃 설정
 */

import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';
import { ChocoAIConfig } from './chocoAITypes';

// ============================================
// Environment Configuration
// ============================================

/**
 * 환경 타입
 */
export type Environment = 'development' | 'production';

/**
 * 현재 환경 감지
 * __DEV__는 React Native의 개발 모드 플래그
 */
export const getCurrentEnvironment = (): Environment => {
  return __DEV__ ? 'development' : 'production';
};

// ============================================
// Server URL Configuration
// ============================================

/**
 * 환경별 서버 URL 설정
 */
const SERVER_URLS: Record<Environment, string> = {
  // 개발 환경: 로컬 네트워크 (PC와 같은 네트워크)
  // 실제 테스트 시 본인의 PC IP로 변경 필요
  development: 'http://192.168.0.100:8080',

  // 프로덕션 환경: DDNS 도메인 사용
  // 실제 배포 시 본인의 DuckDNS 도메인으로 변경 필요
  production: 'http://choco-ai.duckdns.org:8080',
};

/**
 * 현재 환경의 서버 URL 반환
 */
export const getServerUrl = (): string => {
  return SERVER_URLS[getCurrentEnvironment()];
};

/**
 * 서버 URL 직접 설정 (테스트용)
 */
let customServerUrl: string | null = null;

export const setCustomServerUrl = (url: string | null): void => {
  customServerUrl = url;
};

export const getActiveServerUrl = (): string => {
  return customServerUrl || getServerUrl();
};

// ============================================
// API Key Management (react-native-keychain)
// ============================================

const KEYCHAIN_SERVICE = 'com.bibleapp.choco-ai';
const KEYCHAIN_KEY = 'choco_api_key';

/**
 * API Key 저장 (보안 저장소 사용)
 * @param apiKey 저장할 API Key
 * @returns 저장 성공 여부
 */
export const saveApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword(
      KEYCHAIN_KEY,
      apiKey,
      {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      }
    );
    return true;
  } catch (error) {
    console.error('[ChocoAI] API Key 저장 실패:', error);
    return false;
  }
};

/**
 * API Key 불러오기
 * @returns 저장된 API Key 또는 null
 */
export const getApiKey = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    if (credentials && credentials.password) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('[ChocoAI] API Key 불러오기 실패:', error);
    return null;
  }
};

/**
 * API Key 삭제
 * @returns 삭제 성공 여부
 */
export const deleteApiKey = async (): Promise<boolean> => {
  try {
    await Keychain.resetGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    return true;
  } catch (error) {
    console.error('[ChocoAI] API Key 삭제 실패:', error);
    return false;
  }
};

/**
 * API Key 존재 여부 확인
 * @returns API Key 존재 여부
 */
export const hasApiKey = async (): Promise<boolean> => {
  const apiKey = await getApiKey();
  return apiKey !== null && apiKey.length > 0;
};

// ============================================
// Default Configuration
// ============================================

/**
 * 기본 설정값
 */
export const DEFAULT_CONFIG: ChocoAIConfig = {
  serverUrl: getServerUrl(),
  apiKey: '', // 런타임에 Keychain에서 로드
  model: 'llama3.2',
  timeout: 30000, // 30초
  maxRetries: 3,
  retryDelay: 1000, // 1초 (exponential backoff 적용)
};

/**
 * 현재 설정 가져오기
 * @returns 현재 Choco AI 설정
 */
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

/**
 * 설정 유효성 검사
 * @param config 검사할 설정
 * @returns 유효성 검사 결과
 */
export const validateConfig = (config: ChocoAIConfig): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 서버 URL 검사
  if (!config.serverUrl) {
    errors.push('서버 URL이 설정되지 않았습니다.');
  } else if (!config.serverUrl.startsWith('http://') && !config.serverUrl.startsWith('https://')) {
    errors.push('서버 URL은 http:// 또는 https://로 시작해야 합니다.');
  }

  // API Key 검사
  if (!config.apiKey) {
    errors.push('API Key가 설정되지 않았습니다.');
  } else if (config.apiKey.length < 16) {
    errors.push('API Key가 너무 짧습니다. (최소 16자)');
  }

  // 모델명 검사
  if (!config.model) {
    errors.push('모델명이 설정되지 않았습니다.');
  }

  // 타임아웃 검사
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

/**
 * 현재 설정 로그 출력 (개발용)
 * API Key는 마스킹 처리
 */
export const logCurrentConfig = async (): Promise<void> => {
  if (!__DEV__) return;

  const config = await getConfig();
  const maskedApiKey = config.apiKey
    ? `${config.apiKey.substring(0, 4)}****${config.apiKey.substring(config.apiKey.length - 4)}`
    : '(not set)';

  console.log('[ChocoAI] Current Configuration:');
  console.log(`  - Environment: ${getCurrentEnvironment()}`);
  console.log(`  - Server URL: ${config.serverUrl}`);
  console.log(`  - API Key: ${maskedApiKey}`);
  console.log(`  - Model: ${config.model}`);
  console.log(`  - Timeout: ${config.timeout}ms`);
  console.log(`  - Max Retries: ${config.maxRetries}`);
  console.log(`  - Platform: ${Platform.OS}`);
};
