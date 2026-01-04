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

// UTF-8 인코딩 (한글 지원) - React Native 호환
function stringToBytes(str: string): Uint8Array {
  // TextEncoder가 있으면 사용
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  // 수동 UTF-8 인코딩 (React Native 폴백)
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    // 서로게이트 페어 처리 (이모지 등)
    if (charCode >= 0xD800 && charCode <= 0xDBFF && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        charCode = ((charCode - 0xD800) << 10) + (next - 0xDC00) + 0x10000;
        i++;
      }
    }
    if (charCode < 0x80) {
      utf8.push(charCode);
    } else if (charCode < 0x800) {
      utf8.push(0xC0 | (charCode >> 6));
      utf8.push(0x80 | (charCode & 0x3F));
    } else if (charCode < 0x10000) {
      utf8.push(0xE0 | (charCode >> 12));
      utf8.push(0x80 | ((charCode >> 6) & 0x3F));
      utf8.push(0x80 | (charCode & 0x3F));
    } else {
      utf8.push(0xF0 | (charCode >> 18));
      utf8.push(0x80 | ((charCode >> 12) & 0x3F));
      utf8.push(0x80 | ((charCode >> 6) & 0x3F));
      utf8.push(0x80 | (charCode & 0x3F));
    }
  }
  return new Uint8Array(utf8);
}

// UTF-8 디코딩 (한글 지원) - React Native 호환
function bytesToString(bytes: Uint8Array): string {
  // TextDecoder가 있으면 사용
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  // 수동 UTF-8 디코딩 (React Native 폴백)
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
    } else if ((byte1 & 0xE0) === 0xC0) {
      const byte2 = bytes[i++] & 0x3F;
      result += String.fromCharCode(((byte1 & 0x1F) << 6) | byte2);
    } else if ((byte1 & 0xF0) === 0xE0) {
      const byte2 = bytes[i++] & 0x3F;
      const byte3 = bytes[i++] & 0x3F;
      result += String.fromCharCode(((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3);
    } else if ((byte1 & 0xF8) === 0xF0) {
      const byte2 = bytes[i++] & 0x3F;
      const byte3 = bytes[i++] & 0x3F;
      const byte4 = bytes[i++] & 0x3F;
      const codePoint = ((byte1 & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
      // 서로게이트 페어로 변환
      const adjusted = codePoint - 0x10000;
      result += String.fromCharCode(0xD800 + (adjusted >> 10), 0xDC00 + (adjusted & 0x3FF));
    }
  }
  return result;
}

// Base64 인코딩 - React Native 호환
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Encode(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;

    result += BASE64_CHARS[a >> 2];
    result += BASE64_CHARS[((a & 0x03) << 4) | (b >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b & 0x0F) << 2) | (c >> 6)] : '=';
    result += i + 2 < len ? BASE64_CHARS[c & 0x3F] : '=';
  }
  return result;
}

function base64Decode(base64: string): Uint8Array {
  // 패딩 제거 및 유효성 체크
  const cleanBase64 = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = cleanBase64.length;
  const outputLen = Math.floor(len * 3 / 4);
  const bytes = new Uint8Array(outputLen);

  let j = 0;
  for (let i = 0; i < len; i += 4) {
    const a = BASE64_CHARS.indexOf(cleanBase64[i]);
    const b = BASE64_CHARS.indexOf(cleanBase64[i + 1]);
    const c = i + 2 < len ? BASE64_CHARS.indexOf(cleanBase64[i + 2]) : 0;
    const d = i + 3 < len ? BASE64_CHARS.indexOf(cleanBase64[i + 3]) : 0;

    if (j < outputLen) bytes[j++] = (a << 2) | (b >> 4);
    if (j < outputLen && cleanBase64[i + 2] !== '=') bytes[j++] = ((b & 0x0F) << 4) | (c >> 2);
    if (j < outputLen && cleanBase64[i + 3] !== '=') bytes[j++] = ((c & 0x03) << 6) | d;
  }

  return bytes.slice(0, j);
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
