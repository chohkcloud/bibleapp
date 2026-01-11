// src/services/chocoService.ts
// Choco 감정분석 AI API 서비스

import { Platform } from 'react-native';

// ============================================
// 타입 정의
// ============================================

/** 하이브리드 감정분석 응답 */
export interface HybridEmotionResult {
  main_emotion: string;       // 주요 감정 (예: "행복", "평화")
  emotions: string[];         // 감정 태그 목록
  tone: string;               // 분위기 (예: "밝고 따뜻한")
  key_phrases: string[];      // 핵심 표현
  context: {
    kpoem: number;            // KPoEM 매칭 수
    kote: number;             // KOTE 매칭 수
    kosac: number;            // KOSAC 매칭 수
  };
  confidence: number;         // 신뢰도 (0-1)
}

/** API 원본 응답 (내부용) */
interface HybridEmotionApiResponse {
  main_emotion: string;
  emotions: string[];
  tone: string;
  key_phrases: string[];
  rag_context?: {
    kpoem_matches: number;
    kote_matches: number;
    kosac_matches: number;
  };
  confidence?: number;
}

/** 기본 감정분석 응답 */
export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;              // -1 ~ 1
  confidence: number;
}

/** API 헬스 체크 응답 */
export interface HealthCheckResult {
  status: string;
  ollama_connected: boolean;
  model: string;
}

/** 에러 응답 */
interface ApiError {
  detail: string;
}

// ============================================
// 설정
// ============================================

// API 기본 URL (개발 환경에 따라 변경)
const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8080';
  }
  // Android 에뮬레이터에서는 10.0.2.2 사용
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }
  // iOS 시뮬레이터 및 실제 기기
  return 'http://localhost:8080';
};

const API_TIMEOUT = 30000; // 30초 (LLM 응답 대기)

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 타임아웃이 있는 fetch
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// ChocoService 클래스
// ============================================

class ChocoService {
  private baseUrl: string;
  private isAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 60000; // 1분

  constructor() {
    this.baseUrl = getBaseUrl();
  }

  /**
   * API 서버 상태 확인
   */
  async checkHealth(): Promise<HealthCheckResult | null> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/health`,
        { method: 'GET' },
        5000 // 헬스체크는 5초 타임아웃
      );

      if (!response.ok) {
        this.isAvailable = false;
        return null;
      }

      const result: HealthCheckResult = await response.json();
      this.isAvailable = result.status === 'healthy' && result.ollama_connected;
      this.lastHealthCheck = Date.now();
      return result;
    } catch (error) {
      console.log('[ChocoService] API 서버 연결 실패:', error);
      this.isAvailable = false;
      return null;
    }
  }

  /**
   * API 사용 가능 여부 확인
   */
  async isApiAvailable(): Promise<boolean> {
    // 캐시된 상태 사용 (1분 이내)
    if (Date.now() - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isAvailable;
    }

    await this.checkHealth();
    return this.isAvailable;
  }

  /**
   * 하이브리드 감정분석 (KPoEM + KOSAC + KOTE)
   * 묵상노트 텍스트에 대한 깊이 있는 감정분석
   */
  async analyzeHybridEmotion(text: string): Promise<HybridEmotionResult | null> {
    if (!text || text.trim().length === 0) {
      return null;
    }

    try {
      // API 사용 가능 여부 확인
      if (!await this.isApiAvailable()) {
        console.log('[ChocoService] API 서버를 사용할 수 없습니다.');
        return null;
      }

      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/sentiment/hybrid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const error: ApiError = await response.json();
        console.error('[ChocoService] 하이브리드 분석 실패:', error.detail);
        return null;
      }

      const apiResult: HybridEmotionApiResponse = await response.json();

      // API 응답을 표준 형식으로 변환
      const result: HybridEmotionResult = {
        main_emotion: apiResult.main_emotion,
        emotions: apiResult.emotions || [],
        tone: apiResult.tone || '',
        key_phrases: apiResult.key_phrases || [],
        context: {
          kpoem: apiResult.rag_context?.kpoem_matches || 0,
          kote: apiResult.rag_context?.kote_matches || 0,
          kosac: apiResult.rag_context?.kosac_matches || 0,
        },
        confidence: apiResult.confidence || 0.8, // 기본값 80%
      };

      return result;
    } catch (error) {
      console.error('[ChocoService] 하이브리드 감정분석 에러:', error);
      return null;
    }
  }

  /**
   * 기본 감정분석 (긍정/부정/중립)
   */
  async analyzeSentiment(text: string): Promise<SentimentResult | null> {
    if (!text || text.trim().length === 0) {
      return null;
    }

    try {
      if (!await this.isApiAvailable()) {
        return null;
      }

      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/sentiment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        return null;
      }

      const result: SentimentResult = await response.json();
      return result;
    } catch (error) {
      console.error('[ChocoService] 감정분석 에러:', error);
      return null;
    }
  }

  /**
   * RAG 검색 (유사 감정 텍스트 검색)
   */
  async searchSimilarEmotions(
    query: string,
    topK: number = 5
  ): Promise<Array<{ text: string; emotion: string; source: string; score: number }> | null> {
    try {
      if (!await this.isApiAvailable()) {
        return null;
      }

      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/sentiment/hybrid/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, top_k: topK }),
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[ChocoService] RAG 검색 에러:', error);
      return null;
    }
  }

  /**
   * 감정 아이콘 가져오기
   */
  getEmotionIcon(emotion: string): string {
    const emotionIcons: Record<string, string> = {
      // 긍정 감정
      '행복': '😊',
      '기쁨': '😄',
      '감사': '🙏',
      '고마움': '💕',
      '평화': '☮️',
      '안정': '🧘',
      '희망': '🌟',
      '사랑': '❤️',
      '설렘': '💓',
      '즐거움': '🎉',

      // 영적 감정
      '경외감': '✨',
      '성찰': '🪷',
      '깨달음': '💡',
      '겸손': '🙇',
      '신앙': '⛪',
      '은혜': '🕊️',

      // 부정 감정
      '슬픔': '😢',
      '우울': '😔',
      '걱정': '😟',
      '불안': '😰',
      '분노': '😠',
      '후회': '😞',

      // 기타
      '중립': '😐',
      '성찰적': '🤔',
      '비장함': '🎭',
    };

    return emotionIcons[emotion] || '💭';
  }

  /**
   * 감정 색상 가져오기
   */
  getEmotionColor(emotion: string): string {
    const emotionColors: Record<string, string> = {
      // 긍정 감정 (따뜻한 색상)
      '행복': '#FFD700',
      '기쁨': '#FFA500',
      '감사': '#FF69B4',
      '평화': '#98FB98',
      '희망': '#87CEEB',
      '사랑': '#FF6B6B',

      // 영적 감정 (보라/남색 계열)
      '경외감': '#9B59B6',
      '성찰': '#8E44AD',
      '깨달음': '#3498DB',
      '겸손': '#1ABC9C',

      // 부정 감정 (차가운 색상)
      '슬픔': '#5DADE2',
      '우울': '#85929E',
      '불안': '#F39C12',
      '분노': '#E74C3C',
    };

    return emotionColors[emotion] || '#7F8C8D';
  }

  /**
   * API 기본 URL 변경 (설정용)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this.isAvailable = false;
    this.lastHealthCheck = 0;
  }

  /**
   * 현재 API URL 가져오기
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const chocoService = new ChocoService();
