// src/utils/crypto.ts
// 암호화 유틸리티 (웹 호환)

import { Platform } from 'react-native';
import { AppError, ErrorCode } from './errorCodes';

const isWeb = Platform.OS === 'web';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

async function generateRandomBytes(length: number): Promise<Uint8Array> {
  if (isWeb) {
    const array = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < length; i++) { array[i] = Math.floor(Math.random() * 256); }
    }
    return array;
  }
  const Crypto = require('expo-crypto');
  return await Crypto.getRandomBytesAsync(length);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) { bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16); }
  return bytes;
}

function stringToBytes(str: string): Uint8Array { return new TextEncoder().encode(str); }
function bytesToString(bytes: Uint8Array): string { return new TextDecoder().decode(bytes); }

function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

function base64Decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
  return bytes;
}

export async function sha256(data: string): Promise<string> {
  if (isWeb && typeof window !== 'undefined' && window.crypto?.subtle) {
    const dataBuffer = new TextEncoder().encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  if (!isWeb) {
    const Crypto = require('expo-crypto');
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  }
  let hash = 0;
  for (let i = 0; i < data.length; i++) { hash = ((hash << 5) - hash) + data.charCodeAt(i); hash = hash & hash; }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const actualSalt = salt ?? bytesToHex(await generateRandomBytes(SALT_LENGTH));
  let hash = password + ':' + actualSalt;
  for (let i = 0; i < 1000; i++) { hash = await sha256(hash); }
  return { hash, salt: actualSalt };
}

export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  try { const { hash } = await hashPassword(password, salt); return hash === storedHash; } catch { return false; }
}

export async function generateEncryptionKey(): Promise<string> {
  const keyBytes = await generateRandomBytes(KEY_LENGTH);
  return bytesToHex(keyBytes);
}

function xorEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) { result[i] = data[i] ^ key[i % key.length]; }
  return result;
}

export async function encrypt(plainText: string, key: string): Promise<string> {
  const iv = await generateRandomBytes(IV_LENGTH);
  const combinedKey = await sha256(key + bytesToHex(iv));
  const keyBytes = hexToBytes(combinedKey.substring(0, KEY_LENGTH * 2));
  const dataBytes = stringToBytes(plainText);
  const encrypted = xorEncrypt(dataBytes, keyBytes);
  const result = new Uint8Array(iv.length + encrypted.length);
  result.set(iv, 0);
  result.set(encrypted, iv.length);
  return base64Encode(result);
}

export async function decrypt(encryptedText: string, key: string): Promise<string> {
  const combined = base64Decode(encryptedText);
  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);
  const combinedKey = await sha256(key + bytesToHex(iv));
  const keyBytes = hexToBytes(combinedKey.substring(0, KEY_LENGTH * 2));
  const decrypted = xorEncrypt(encrypted, keyBytes);
  return bytesToString(decrypted);
}

export async function generateUUID(): Promise<string> {
  const bytes = await generateRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return hex.substring(0,8)+'-'+hex.substring(8,12)+'-'+hex.substring(12,16)+'-'+hex.substring(16,20)+'-'+hex.substring(20,32);
}
