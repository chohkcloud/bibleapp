// src/services/bibleVersionService.ts
// 성경 버전 관리 통합 서비스

import { bibleApiService } from './bibleApiService';
import { bibleDownloadService } from './bibleDownloadService';
import type { BibleVersionInfo, DownloadProgress } from '../types/database';

class BibleVersionService {
  /**
   * 사용 가능한 모든 버전 목록 (다운로드 상태 포함)
   */
  async getAllVersions(): Promise<BibleVersionInfo[]> {
    const versions = bibleApiService.getAvailableVersions();
    const downloadedIds = await bibleDownloadService.getDownloadedVersions();

    return versions.map((v) => ({
      ...v,
      isDownloaded: downloadedIds.includes(v.id),
    }));
  }

  /**
   * 다운로드된 버전만 반환
   */
  async getDownloadedVersions(): Promise<BibleVersionInfo[]> {
    const allVersions = await this.getAllVersions();
    return allVersions.filter((v) => v.isDownloaded);
  }

  /**
   * 다운로드 가능한 버전만 반환
   */
  async getAvailableForDownload(): Promise<BibleVersionInfo[]> {
    const allVersions = await this.getAllVersions();
    return allVersions.filter((v) => !v.isDownloaded && !v.isBundled);
  }

  /**
   * 언어별 버전 목록
   */
  async getVersionsByLanguage(langId: string): Promise<BibleVersionInfo[]> {
    const allVersions = await this.getAllVersions();
    return allVersions.filter((v) => v.language === langId);
  }

  /**
   * 지원 언어 목록
   */
  getLanguages(): Array<{ id: string; name: string; nameEnglish: string }> {
    return bibleApiService.getLanguages();
  }

  /**
   * 버전 다운로드
   */
  async downloadVersion(
    versionId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    return bibleDownloadService.downloadVersion(versionId, onProgress);
  }

  /**
   * 다운로드 취소
   */
  cancelDownload(versionId: string): void {
    bibleDownloadService.cancelDownload(versionId);
  }

  /**
   * 버전 삭제
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    return bibleDownloadService.deleteVersion(versionId);
  }

  /**
   * 버전이 다운로드되었는지 확인
   */
  async isVersionDownloaded(versionId: string): Promise<boolean> {
    return bibleDownloadService.isVersionDownloaded(versionId);
  }

  /**
   * 버전 정보 조회
   */
  async getVersionInfo(versionId: string): Promise<BibleVersionInfo | undefined> {
    const allVersions = await this.getAllVersions();
    return allVersions.find((v) => v.id === versionId);
  }

  /**
   * 네트워크 연결 확인
   */
  async checkConnection(): Promise<boolean> {
    return bibleApiService.checkConnection();
  }

  /**
   * 마지막 사용 시간 업데이트
   */
  async updateLastUsed(versionId: string): Promise<void> {
    return bibleDownloadService.updateLastUsed(versionId);
  }

  /**
   * 파일 크기 포맷
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export const bibleVersionService = new BibleVersionService();
