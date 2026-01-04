// src/services/database/index.web.ts
// DatabaseService 클래스 - 웹 전용 (목업 모드)

class DatabaseService {
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    console.log('[DatabaseService] 웹 환경 - 목업 모드');
    this.isInitialized = true;
  }

  getBibleDb(): any {
    return null;
  }

  getUserDb(): any {
    return null;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  isWebPlatform(): boolean {
    return true;
  }

  async close(): Promise<void> {
    this.isInitialized = false;
  }
}

export const databaseService = new DatabaseService();
