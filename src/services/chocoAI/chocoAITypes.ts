/**
 * Choco AI Types
 * Ollama API 요청/응답 및 에러 타입 정의
 */

// ============================================
// Ollama API Types
// ============================================

/**
 * Ollama /api/generate 요청 타입
 */
export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: OllamaOptions;
  system?: string;
  template?: string;
  context?: number[];
  raw?: boolean;
  format?: 'json';
  keep_alive?: string;
}

/**
 * Ollama /api/chat 요청 타입
 */
export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: OllamaOptions;
  format?: 'json';
  keep_alive?: string;
}

/**
 * Ollama 채팅 메시지 타입
 */
export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 encoded images
}

/**
 * Ollama 옵션 (모델 파라미터)
 */
export interface OllamaOptions {
  temperature?: number;      // 0.0 ~ 2.0, 기본 0.8
  top_k?: number;            // 기본 40
  top_p?: number;            // 0.0 ~ 1.0, 기본 0.9
  num_predict?: number;      // 최대 생성 토큰 수
  num_ctx?: number;          // 컨텍스트 윈도우 크기
  stop?: string[];           // 생성 중단 토큰
  seed?: number;             // 랜덤 시드
  repeat_penalty?: number;   // 반복 페널티
  presence_penalty?: number;
  frequency_penalty?: number;
}

/**
 * Ollama /api/generate 응답 타입 (스트리밍)
 */
export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ollama /api/chat 응답 타입 (스트리밍)
 */
export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaChatMessage;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// ============================================
// Choco AI Service Types
// ============================================

/**
 * Choco AI 설정 타입
 */
export interface ChocoAIConfig {
  serverUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Choco AI 에러 코드
 */
export enum ChocoAIErrorCode {
  // 네트워크 에러
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',

  // 인증 에러
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_API_KEY = 'INVALID_API_KEY',

  // 서버 에러
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',

  // 요청 에러
  BAD_REQUEST = 'BAD_REQUEST',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',

  // 기타
  UNKNOWN = 'UNKNOWN',
}

/**
 * Choco AI 에러 클래스
 */
export class ChocoAIError extends Error {
  code: ChocoAIErrorCode;
  statusCode?: number;
  retryable: boolean;
  originalError?: Error;

  constructor(
    message: string,
    code: ChocoAIErrorCode,
    options?: {
      statusCode?: number;
      retryable?: boolean;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'ChocoAIError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.retryable = options?.retryable ?? false;
    this.originalError = options?.originalError;
  }

  /**
   * 사용자 친화적 에러 메시지 반환
   */
  getUserMessage(): string {
    switch (this.code) {
      case ChocoAIErrorCode.NETWORK_ERROR:
        return '네트워크 연결을 확인해주세요.';
      case ChocoAIErrorCode.TIMEOUT:
        return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
      case ChocoAIErrorCode.OFFLINE:
        return '인터넷 연결이 없습니다. 연결 후 다시 시도해주세요.';
      case ChocoAIErrorCode.UNAUTHORIZED:
      case ChocoAIErrorCode.INVALID_API_KEY:
        return 'API 키가 올바르지 않습니다. 설정을 확인해주세요.';
      case ChocoAIErrorCode.SERVER_ERROR:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case ChocoAIErrorCode.SERVICE_UNAVAILABLE:
        return 'AI 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
      case ChocoAIErrorCode.RATE_LIMITED:
        return '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      case ChocoAIErrorCode.MODEL_NOT_FOUND:
        return 'AI 모델을 찾을 수 없습니다.';
      default:
        return '알 수 없는 오류가 발생했습니다.';
    }
  }
}

// ============================================
// Callback Types
// ============================================

/**
 * 스트리밍 청크 콜백 타입
 */
export type StreamChunkCallback = (chunk: string, done: boolean) => void;

/**
 * 스트리밍 에러 콜백 타입
 */
export type StreamErrorCallback = (error: ChocoAIError) => void;

/**
 * 스트리밍 옵션 타입
 */
export interface StreamOptions {
  onChunk: StreamChunkCallback;
  onError?: StreamErrorCallback;
  onComplete?: () => void;
  signal?: AbortSignal;
}

// ============================================
// Response Types
// ============================================

/**
 * Choco AI 응답 타입
 */
export interface ChocoAIResponse {
  success: boolean;
  response?: string;
  error?: ChocoAIError;
  metadata?: {
    model: string;
    totalDuration?: number;
    promptTokens?: number;
    responseTokens?: number;
  };
}
