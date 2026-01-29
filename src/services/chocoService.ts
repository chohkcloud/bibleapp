// src/services/chocoService.ts
// Choco 감정분석 AI API 서비스
// 수정일: 2026-01-23 - API Key 인증 헤더 추가

import { Platform } from 'react-native';
import { getApiKey, getActiveServerUrl, loadServerUrl } from './chocoAI/chocoAIConfig';

export interface HybridEmotionResult {
  main_emotion: string;
  emotions: string[];
  tone: string;
  key_phrases: string[];
  context: { kpoem: number; kote: number; kosac: number; };
  confidence: number;
}

interface HybridEmotionApiResponse {
  main_emotion: string;
  emotions: string[];
  tone: string;
  key_phrases: string[];
  rag_context?: { kpoem_matches: number; kote_matches: number; kosac_matches: number; };
  confidence?: number;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}

export interface HealthCheckResult {
  status: string;
  ollama_status: string;
  model: string;
}

interface ApiError { detail: string; }

const getBaseUrl = (): string => getActiveServerUrl();
const API_TIMEOUT = 30000;

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

class ChocoService {
  private isAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private lastFailedCheck: number = 0;
  private healthCheckInterval: number = 60000;
  private failedCooldownInterval: number = 5 * 60 * 1000; // 5분으로 단축
  private isInitialized: boolean = false;

  constructor() {}

  /**
   * 서비스 초기화 (저장된 서버 URL 로드)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await loadServerUrl();
    this.isInitialized = true;
  }

  /**
   * 초기화 확인 후 실행
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // 항상 최신 URL 사용
  private get baseUrl(): string { return getBaseUrl(); }

  async checkHealth(): Promise<HealthCheckResult | null> {
    await this.ensureInitialized();
    try {
      const response = await fetchWithTimeout(this.baseUrl + '/api/health', { method: 'GET' }, 5000);
      if (!response.ok) { this.isAvailable = false; this.lastFailedCheck = Date.now(); return null; }
      const result: HealthCheckResult = await response.json();
      this.isAvailable = result.status === 'healthy' && result.ollama_status === 'connected';
      this.lastHealthCheck = Date.now();
      this.lastFailedCheck = this.isAvailable ? 0 : Date.now();
      return result;
    } catch { this.isAvailable = false; this.lastFailedCheck = Date.now(); return null; }
  }

  async isApiAvailable(): Promise<boolean> {
    await this.ensureInitialized();
    const now = Date.now();
    if (this.lastFailedCheck > 0 && now - this.lastFailedCheck < this.failedCooldownInterval) return false;
    if (this.isAvailable && now - this.lastHealthCheck < this.healthCheckInterval) return true;
    await this.checkHealth();
    return this.isAvailable;
  }

  isCurrentlyAvailable(): boolean { return this.isAvailable; }
  getNextRetryTime(): number { return this.lastFailedCheck === 0 ? 0 : Math.max(0, this.failedCooldownInterval - (Date.now() - this.lastFailedCheck)); }

  async analyzeHybridEmotion(text: string): Promise<HybridEmotionResult | null> {
    if (!text || text.trim().length === 0) return null;
    try {
      if (!await this.isApiAvailable()) return null;
      const apiKey = await getApiKey();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;
      const response = await fetchWithTimeout(this.baseUrl + '/api/sentiment/hybrid', { method: 'POST', headers, body: JSON.stringify({ text }) });
      if (!response.ok) return null;
      const r: HybridEmotionApiResponse = await response.json();
      return { main_emotion: r.main_emotion, emotions: r.emotions || [], tone: r.tone || '', key_phrases: r.key_phrases || [],
        context: { kpoem: r.rag_context?.kpoem_matches || 0, kote: r.rag_context?.kote_matches || 0, kosac: r.rag_context?.kosac_matches || 0 },
        confidence: r.confidence || 0.8 };
    } catch { return null; }
  }

  async analyzeSentiment(text: string): Promise<SentimentResult | null> {
    if (!text || text.trim().length === 0) return null;
    try {
      if (!await this.isApiAvailable()) return null;
      const apiKey = await getApiKey();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;
      const response = await fetchWithTimeout(this.baseUrl + '/api/sentiment', { method: 'POST', headers, body: JSON.stringify({ text }) });
      if (!response.ok) return null;
      return await response.json();
    } catch { return null; }
  }

  async searchSimilarEmotions(query: string, topK: number = 5): Promise<Array<{ text: string; emotion: string; source: string; score: number }> | null> {
    try {
      if (!await this.isApiAvailable()) return null;
      const apiKey = await getApiKey();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;
      const response = await fetchWithTimeout(this.baseUrl + '/api/sentiment/hybrid/search', { method: 'POST', headers, body: JSON.stringify({ query, top_k: topK }) });
      if (!response.ok) return null;
      return await response.json();
    } catch { return null; }
  }

  getEmotionIcon(emotion: string): string {
    const icons: Record<string, string> = { '행복': '😊', '기쁨': '😄', '감사': '🙏', '평화': '☮️', '희망': '🌟', '사랑': '❤️', '경외감': '✨', '성찰': '🪷', '슬픔': '😢', '불안': '😰' };
    return icons[emotion] || '💭';
  }

  getEmotionColor(emotion: string): string {
    const colors: Record<string, string> = { '행복': '#FFD700', '기쁨': '#FFA500', '감사': '#FF69B4', '평화': '#98FB98', '희망': '#87CEEB', '사랑': '#FF6B6B', '슬픔': '#5DADE2', '불안': '#F39C12' };
    return colors[emotion] || '#7F8C8D';
  }

  async analyzeOnSave(text: string, callback?: (result: HybridEmotionResult | null) => void): Promise<HybridEmotionResult | null> {
    if (!text || text.trim().length < 20) { callback?.(null); return null; }
    if (!await this.isApiAvailable()) { callback?.(null); return null; }
    const result = await this.analyzeHybridEmotion(text);
    callback?.(result);
    return result;
  }

  serializeEmotionResult(result: HybridEmotionResult): string { return JSON.stringify(result); }
  parseEmotionResult(json: string): HybridEmotionResult | null { try { return JSON.parse(json); } catch { return null; } }
  refreshUrl(): void { this.isAvailable = false; this.lastHealthCheck = 0; this.lastFailedCheck = 0; }
  getBaseUrl(): string { return this.baseUrl; }
  resetCooldown(): void { this.lastFailedCheck = 0; this.isAvailable = false; this.lastHealthCheck = 0; }
}

export const chocoService = new ChocoService();

// 쿨다운 리셋 함수 (설정 변경 시 호출)
export const resetChocoServiceCooldown = (): void => {
  chocoService.resetCooldown();
  console.log('[ChocoService] 쿨다운 리셋됨');
};
