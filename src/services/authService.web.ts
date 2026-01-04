// src/services/authService.web.ts
// 인증 서비스 (웹 전용)

import { hashPassword, verifyPassword, generateEncryptionKey } from '../utils/crypto';
import { AppError, ErrorCode } from '../utils/errorCodes';

// 웹용 메모리 스토어 (세션 동안만 유지)
const webStore: Record<string, string> = {};

const SECURE_KEYS = {
  PASSWORD_HASH: 'bible_app_password_hash',
  PASSWORD_SALT: 'bible_app_password_salt',
  ENCRYPTION_KEY: 'bible_app_encryption_key',
  BIOMETRIC_ENABLED: 'bible_app_biometric_enabled',
} as const;

async function getItem(key: string): Promise<string | null> {
  return webStore[key] || localStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  webStore[key] = value;
  localStorage.setItem(key, value);
}

async function deleteItem(key: string): Promise<void> {
  delete webStore[key];
  localStorage.removeItem(key);
}

class AuthService {
  async isPasswordSet(): Promise<boolean> {
    try { const hash = await getItem(SECURE_KEYS.PASSWORD_HASH); return hash !== null; }
    catch { return false; }
  }

  async setPassword(password: string): Promise<void> {
    if (!password || password.length < 4) {
      throw new AppError(ErrorCode.VALIDATION_LENGTH, '비밀번호는 최소 4자리 이상이어야 합니다.');
    }
    const { hash, salt } = await hashPassword(password);
    await setItem(SECURE_KEYS.PASSWORD_HASH, hash);
    await setItem(SECURE_KEYS.PASSWORD_SALT, salt);
    const existingKey = await getItem(SECURE_KEYS.ENCRYPTION_KEY);
    if (!existingKey) {
      const encryptionKey = await generateEncryptionKey();
      await setItem(SECURE_KEYS.ENCRYPTION_KEY, encryptionKey);
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    try {
      const storedHash = await getItem(SECURE_KEYS.PASSWORD_HASH);
      const storedSalt = await getItem(SECURE_KEYS.PASSWORD_SALT);
      if (!storedHash || !storedSalt) { return false; }
      return await verifyPassword(password, storedHash, storedSalt);
    } catch { return false; }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const isValid = await this.verifyPassword(oldPassword);
    if (!isValid) { throw new AppError(ErrorCode.AUTH_PASSWORD_MISMATCH); }
    await this.setPassword(newPassword);
    return true;
  }

  async isBiometricAvailable(): Promise<boolean> {
    return false;
  }

  async getBiometricTypes(): Promise<number[]> {
    return [];
  }

  async isBiometricEnabled(): Promise<boolean> {
    return false;
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      throw new AppError(ErrorCode.AUTH_BIOMETRIC_NOT_AVAILABLE);
    }
  }

  async authenticateWithBiometric(): Promise<boolean> {
    return false;
  }

  async getEncryptionKey(): Promise<string> {
    let key = await getItem(SECURE_KEYS.ENCRYPTION_KEY);
    if (!key) {
      key = await generateEncryptionKey();
      await setItem(SECURE_KEYS.ENCRYPTION_KEY, key);
    }
    return key;
  }

  async clearAllAuthData(): Promise<void> {
    await deleteItem(SECURE_KEYS.PASSWORD_HASH);
    await deleteItem(SECURE_KEYS.PASSWORD_SALT);
    await deleteItem(SECURE_KEYS.ENCRYPTION_KEY);
    await deleteItem(SECURE_KEYS.BIOMETRIC_ENABLED);
  }
}

export const authService = new AuthService();
