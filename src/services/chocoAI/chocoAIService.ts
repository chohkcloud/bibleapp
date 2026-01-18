/**
 * Choco AI Service
 * Ollama API 호출, 스트리밍, 재시도 로직 구현
 */

import NetInfo from '@react-native-community/netinfo';
import {
  ChocoAIConfig,
  ChocoAIError,
  ChocoAIErrorCode,
  ChocoAIResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaChatMessage,
  StreamOptions,
  OllamaOptions,
} from './chocoAITypes';
import { getConfig, getActiveServerUrl, getApiKey } from './chocoAIConfig';

// ============================================
// Network Status
// ============================================

/**
 * 네트워크 연결 상태 확인
 * @returns 온라인 여부
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true && netInfo.isInternetReachable !== false;
  } catch (error) {
    console.error('[ChocoAI] 네트워크 상태 확인 실패:', error);
    return true; // 확인 실패 시 일단 온라인으로 가정
  }
};

/**
 * 오프라인 에러 생성
 */
const createOfflineError = (): ChocoAIError => {
  return new ChocoAIError(
    '인터넷 연결이 없습니다.',
    ChocoAIErrorCode.OFFLINE,
    { retryable: true }
  );
};

// ============================================
// HTTP Error Handling
// ============================================

/**
 * HTTP 상태 코드에 따른 에러 생성
 */
const createErrorFromStatus = (
  status: number,
  message?: string
): ChocoAIError => {
  let code: ChocoAIErrorCode;
  let retryable = false;

  switch (status) {
    case 400:
      code = ChocoAIErrorCode.BAD_REQUEST;
      break;
    case 401:
    case 403:
      code = ChocoAIErrorCode.UNAUTHORIZED;
      break;
    case 404:
      code = ChocoAIErrorCode.MODEL_NOT_FOUND;
      break;
    case 429:
      code = ChocoAIErrorCode.RATE_LIMITED;
      retryable = true;
      break;
    case 500:
    case 502:
    case 503:
      code = ChocoAIErrorCode.SERVER_ERROR;
      retryable = true;
      break;
    case 504:
      code = ChocoAIErrorCode.TIMEOUT;
      retryable = true;
      break;
    default:
      code = status >= 500
        ? ChocoAIErrorCode.SERVER_ERROR
        : ChocoAIErrorCode.UNKNOWN;
      retryable = status >= 500;
  }

  return new ChocoAIError(
    message || `HTTP Error: ${status}`,
    code,
    { statusCode: status, retryable }
  );
};

/**
 * 네트워크 에러 처리
 */
const handleNetworkError = (error: Error): ChocoAIError => {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
    return new ChocoAIError(
      '요청 시간이 초과되었습니다.',
      ChocoAIErrorCode.TIMEOUT,
      { retryable: true, originalError: error }
    );
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return new ChocoAIError(
      '네트워크 연결 오류가 발생했습니다.',
      ChocoAIErrorCode.NETWORK_ERROR,
      { retryable: true, originalError: error }
    );
  }

  return new ChocoAIError(
    error.message || '알 수 없는 오류가 발생했습니다.',
    ChocoAIErrorCode.UNKNOWN,
    { retryable: false, originalError: error }
  );
};

// ============================================
// Retry Logic (Exponential Backoff)
// ============================================

/**
 * 지연 시간 계산 (exponential backoff)
 * @param attempt 현재 시도 횟수 (0부터 시작)
 * @param baseDelay 기본 지연 시간 (ms)
 * @returns 지연 시간 (ms)
 */
const calculateBackoffDelay = (attempt: number, baseDelay: number): number => {
  // exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 30% 지터
  return Math.min(exponentialDelay + jitter, 30000); // 최대 30초
};

/**
 * 지연 함수
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 재시도 로직이 포함된 함수 실행
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  config: ChocoAIConfig,
  signal?: AbortSignal
): Promise<T> => {
  let lastError: ChocoAIError | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    // 취소 확인
    if (signal?.aborted) {
      throw new ChocoAIError(
        '요청이 취소되었습니다.',
        ChocoAIErrorCode.TIMEOUT,
        { retryable: false }
      );
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof ChocoAIError
        ? error
        : handleNetworkError(error as Error);

      // 재시도 가능한 에러가 아니면 즉시 throw
      if (!lastError.retryable) {
        throw lastError;
      }

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < config.maxRetries - 1) {
        const backoffDelay = calculateBackoffDelay(attempt, config.retryDelay);
        console.log(`[ChocoAI] 재시도 ${attempt + 1}/${config.maxRetries - 1}, ${backoffDelay}ms 후 재시도...`);
        await delay(backoffDelay);
      }
    }
  }

  // 모든 재시도 실패
  throw lastError || new ChocoAIError(
    '모든 재시도가 실패했습니다.',
    ChocoAIErrorCode.UNKNOWN,
    { retryable: false }
  );
};

// ============================================
// API Request Helpers
// ============================================

/**
 * API 요청 헤더 생성
 */
const createHeaders = (apiKey: string): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'Accept': 'application/json',
  };
};

/**
 * 타임아웃이 적용된 fetch
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ============================================
// Main API Functions
// ============================================

/**
 * 텍스트 생성 (비스트리밍)
 * @param prompt 사용자 프롬프트
 * @param options Ollama 옵션 (선택)
 * @returns 생성된 응답
 */
export const generateResponse = async (
  prompt: string,
  options?: OllamaOptions
): Promise<ChocoAIResponse> => {
  // 오프라인 체크
  if (!(await isOnline())) {
    const error = createOfflineError();
    return { success: false, error };
  }

  const config = await getConfig();

  // API Key 확인
  if (!config.apiKey) {
    const error = new ChocoAIError(
      'API Key가 설정되지 않았습니다.',
      ChocoAIErrorCode.INVALID_API_KEY,
      { retryable: false }
    );
    return { success: false, error };
  }

  try {
    const result = await withRetry(async () => {
      const requestBody: OllamaGenerateRequest = {
        model: config.model,
        prompt,
        stream: false,
        options,
      };

      const response = await fetchWithTimeout(
        `${config.serverUrl}/api/generate`,
        {
          method: 'POST',
          headers: createHeaders(config.apiKey),
          body: JSON.stringify(requestBody),
        },
        config.timeout
      );

      if (!response.ok) {
        throw createErrorFromStatus(response.status);
      }

      const data: OllamaGenerateResponse = await response.json();
      return data;
    }, config);

    return {
      success: true,
      response: result.response,
      metadata: {
        model: result.model,
        totalDuration: result.total_duration,
        promptTokens: result.prompt_eval_count,
        responseTokens: result.eval_count,
      },
    };
  } catch (error) {
    const chocoError = error instanceof ChocoAIError
      ? error
      : handleNetworkError(error as Error);
    return { success: false, error: chocoError };
  }
};

/**
 * 스트리밍 텍스트 생성
 * @param prompt 사용자 프롬프트
 * @param streamOptions 스트리밍 콜백 옵션
 * @param ollamaOptions Ollama 옵션 (선택)
 */
export const streamResponse = async (
  prompt: string,
  streamOptions: StreamOptions,
  ollamaOptions?: OllamaOptions
): Promise<void> => {
  const { onChunk, onError, onComplete, signal } = streamOptions;

  // 오프라인 체크
  if (!(await isOnline())) {
    const error = createOfflineError();
    onError?.(error);
    return;
  }

  const config = await getConfig();

  // API Key 확인
  if (!config.apiKey) {
    const error = new ChocoAIError(
      'API Key가 설정되지 않았습니다.',
      ChocoAIErrorCode.INVALID_API_KEY,
      { retryable: false }
    );
    onError?.(error);
    return;
  }

  try {
    const requestBody: OllamaGenerateRequest = {
      model: config.model,
      prompt,
      stream: true,
      options: ollamaOptions,
    };

    const response = await fetchWithTimeout(
      `${config.serverUrl}/api/generate`,
      {
        method: 'POST',
        headers: createHeaders(config.apiKey),
        body: JSON.stringify(requestBody),
        signal,
      },
      config.timeout
    );

    if (!response.ok) {
      const error = createErrorFromStatus(response.status);
      onError?.(error);
      return;
    }

    // 스트리밍 응답 처리
    const reader = response.body?.getReader();
    if (!reader) {
      const error = new ChocoAIError(
        '스트리밍을 지원하지 않는 응답입니다.',
        ChocoAIErrorCode.SERVER_ERROR,
        { retryable: false }
      );
      onError?.(error);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // 줄바꿈으로 분리하여 각 JSON 라인 처리
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 유지

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data: OllamaGenerateResponse = JSON.parse(line);
          onChunk(data.response, data.done);

          if (data.done) {
            onComplete?.();
            return;
          }
        } catch (parseError) {
          console.warn('[ChocoAI] JSON 파싱 실패:', line);
        }
      }
    }

    // 버퍼에 남은 데이터 처리
    if (buffer.trim()) {
      try {
        const data: OllamaGenerateResponse = JSON.parse(buffer);
        onChunk(data.response, data.done);
      } catch (parseError) {
        console.warn('[ChocoAI] 마지막 JSON 파싱 실패:', buffer);
      }
    }

    onComplete?.();
  } catch (error) {
    const chocoError = error instanceof ChocoAIError
      ? error
      : handleNetworkError(error as Error);
    onError?.(chocoError);
  }
};

/**
 * 채팅 API (비스트리밍)
 * @param messages 채팅 메시지 배열
 * @param options Ollama 옵션 (선택)
 * @returns 생성된 응답
 */
export const chatResponse = async (
  messages: OllamaChatMessage[],
  options?: OllamaOptions
): Promise<ChocoAIResponse> => {
  // 오프라인 체크
  if (!(await isOnline())) {
    const error = createOfflineError();
    return { success: false, error };
  }

  const config = await getConfig();

  // API Key 확인
  if (!config.apiKey) {
    const error = new ChocoAIError(
      'API Key가 설정되지 않았습니다.',
      ChocoAIErrorCode.INVALID_API_KEY,
      { retryable: false }
    );
    return { success: false, error };
  }

  try {
    const result = await withRetry(async () => {
      const requestBody: OllamaChatRequest = {
        model: config.model,
        messages,
        stream: false,
        options,
      };

      const response = await fetchWithTimeout(
        `${config.serverUrl}/api/chat`,
        {
          method: 'POST',
          headers: createHeaders(config.apiKey),
          body: JSON.stringify(requestBody),
        },
        config.timeout
      );

      if (!response.ok) {
        throw createErrorFromStatus(response.status);
      }

      const data: OllamaChatResponse = await response.json();
      return data;
    }, config);

    return {
      success: true,
      response: result.message.content,
      metadata: {
        model: result.model,
        totalDuration: result.total_duration,
        promptTokens: result.prompt_eval_count,
        responseTokens: result.eval_count,
      },
    };
  } catch (error) {
    const chocoError = error instanceof ChocoAIError
      ? error
      : handleNetworkError(error as Error);
    return { success: false, error: chocoError };
  }
};

/**
 * 스트리밍 채팅 API
 * @param messages 채팅 메시지 배열
 * @param streamOptions 스트리밍 콜백 옵션
 * @param ollamaOptions Ollama 옵션 (선택)
 */
export const streamChatResponse = async (
  messages: OllamaChatMessage[],
  streamOptions: StreamOptions,
  ollamaOptions?: OllamaOptions
): Promise<void> => {
  const { onChunk, onError, onComplete, signal } = streamOptions;

  // 오프라인 체크
  if (!(await isOnline())) {
    const error = createOfflineError();
    onError?.(error);
    return;
  }

  const config = await getConfig();

  // API Key 확인
  if (!config.apiKey) {
    const error = new ChocoAIError(
      'API Key가 설정되지 않았습니다.',
      ChocoAIErrorCode.INVALID_API_KEY,
      { retryable: false }
    );
    onError?.(error);
    return;
  }

  try {
    const requestBody: OllamaChatRequest = {
      model: config.model,
      messages,
      stream: true,
      options: ollamaOptions,
    };

    const response = await fetchWithTimeout(
      `${config.serverUrl}/api/chat`,
      {
        method: 'POST',
        headers: createHeaders(config.apiKey),
        body: JSON.stringify(requestBody),
        signal,
      },
      config.timeout
    );

    if (!response.ok) {
      const error = createErrorFromStatus(response.status);
      onError?.(error);
      return;
    }

    // 스트리밍 응답 처리
    const reader = response.body?.getReader();
    if (!reader) {
      const error = new ChocoAIError(
        '스트리밍을 지원하지 않는 응답입니다.',
        ChocoAIErrorCode.SERVER_ERROR,
        { retryable: false }
      );
      onError?.(error);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // 줄바꿈으로 분리하여 각 JSON 라인 처리
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 유지

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data: OllamaChatResponse = JSON.parse(line);
          onChunk(data.message.content, data.done);

          if (data.done) {
            onComplete?.();
            return;
          }
        } catch (parseError) {
          console.warn('[ChocoAI] JSON 파싱 실패:', line);
        }
      }
    }

    // 버퍼에 남은 데이터 처리
    if (buffer.trim()) {
      try {
        const data: OllamaChatResponse = JSON.parse(buffer);
        onChunk(data.message.content, data.done);
      } catch (parseError) {
        console.warn('[ChocoAI] 마지막 JSON 파싱 실패:', buffer);
      }
    }

    onComplete?.();
  } catch (error) {
    const chocoError = error instanceof ChocoAIError
      ? error
      : handleNetworkError(error as Error);
    onError?.(chocoError);
  }
};

// ============================================
// Health Check
// ============================================

/**
 * 서버 연결 상태 확인
 * @returns 서버 연결 가능 여부
 */
export const checkServerHealth = async (): Promise<{
  healthy: boolean;
  latency?: number;
  error?: ChocoAIError;
}> => {
  // 오프라인 체크
  if (!(await isOnline())) {
    return { healthy: false, error: createOfflineError() };
  }

  const config = await getConfig();
  const startTime = Date.now();

  try {
    const response = await fetchWithTimeout(
      `${config.serverUrl}/health`,
      {
        method: 'GET',
        headers: config.apiKey ? createHeaders(config.apiKey) : {},
      },
      5000 // 5초 타임아웃
    );

    const latency = Date.now() - startTime;

    if (response.ok) {
      return { healthy: true, latency };
    }

    return {
      healthy: false,
      latency,
      error: createErrorFromStatus(response.status),
    };
  } catch (error) {
    return {
      healthy: false,
      error: handleNetworkError(error as Error),
    };
  }
};
