/**
 * Choco AI Service
 * 모바일 앱용 Ollama AI 서비스 모듈
 *
 * @example
 * ```typescript
 * import {
 *   generateResponse,
 *   streamResponse,
 *   saveApiKey,
 *   checkServerHealth,
 *   ChocoAIError,
 * } from '@/services/chocoAI';
 *
 * // API Key 저장
 * await saveApiKey('your-api-key-here');
 *
 * // 텍스트 생성 (비스트리밍)
 * const result = await generateResponse('안녕하세요');
 * if (result.success) {
 *   console.log(result.response);
 * } else {
 *   console.error(result.error?.getUserMessage());
 * }
 *
 * // 스트리밍 응답
 * await streamResponse('오늘 날씨는?', {
 *   onChunk: (chunk, done) => {
 *     console.log(chunk);
 *   },
 *   onError: (error) => {
 *     console.error(error.getUserMessage());
 *   },
 *   onComplete: () => {
 *     console.log('완료');
 *   },
 * });
 * ```
 */

// ============================================
// Types
// ============================================
export {
  // Ollama API Types
  OllamaGenerateRequest,
  OllamaChatRequest,
  OllamaChatMessage,
  OllamaOptions,
  OllamaGenerateResponse,
  OllamaChatResponse,

  // Choco AI Types
  ChocoAIConfig,
  ChocoAIErrorCode,
  ChocoAIError,
  ChocoAIResponse,

  // Callback Types
  StreamChunkCallback,
  StreamErrorCallback,
  StreamOptions,
} from './chocoAITypes';

// ============================================
// Configuration
// ============================================
export {
  // Environment
  Environment,
  getCurrentEnvironment,

  // Server URL
  getServerUrl,
  setCustomServerUrl,
  getActiveServerUrl,

  // API Key Management
  saveApiKey,
  getApiKey,
  deleteApiKey,
  hasApiKey,

  // Configuration
  DEFAULT_CONFIG,
  getConfig,
  validateConfig,

  // Debug
  logCurrentConfig,
} from './chocoAIConfig';

// ============================================
// Service Functions
// ============================================
export {
  // Network Status
  isOnline,

  // Generate API
  generateResponse,
  streamResponse,

  // Chat API
  chatResponse,
  streamChatResponse,

  // Health Check
  checkServerHealth,
} from './chocoAIService';
