// src/utils/errorCodes.ts
// 에러 코드 및 에러 클래스 정의

/**
 * 앱 에러 코드
 */
export enum ErrorCode {
  // Database (DB_XXX)
  DB_INIT_FAILED = 'DB_001',
  DB_QUERY_FAILED = 'DB_002',
  DB_NOT_FOUND = 'DB_003',
  DB_TRANSACTION_FAILED = 'DB_004',
  DB_EXPORT_FAILED = 'DB_005',
  DB_IMPORT_FAILED = 'DB_006',

  // Auth (AUTH_XXX)
  AUTH_INVALID_PASSWORD = 'AUTH_001',
  AUTH_BIOMETRIC_FAILED = 'AUTH_002',
  AUTH_BIOMETRIC_NOT_AVAILABLE = 'AUTH_003',
  AUTH_PASSWORD_NOT_SET = 'AUTH_004',
  AUTH_PASSWORD_MISMATCH = 'AUTH_005',

  // Encryption (ENC_XXX)
  ENCRYPT_FAILED = 'ENC_001',
  DECRYPT_FAILED = 'ENC_002',
  KEY_NOT_FOUND = 'ENC_003',
  KEY_GENERATION_FAILED = 'ENC_004',

  // Share (SHARE_XXX)
  SHARE_CAPTURE_FAILED = 'SHARE_001',
  SHARE_NOT_AVAILABLE = 'SHARE_002',
  SHARE_FILE_ERROR = 'SHARE_003',

  // Validation (VAL_XXX)
  VALIDATION_REQUIRED = 'VAL_001',
  VALIDATION_FORMAT = 'VAL_002',
  VALIDATION_LENGTH = 'VAL_003',

  // Memo (MEMO_XXX)
  MEMO_NOT_FOUND = 'MEMO_001',
  MEMO_CREATE_FAILED = 'MEMO_002',
  MEMO_UPDATE_FAILED = 'MEMO_003',
  MEMO_DELETE_FAILED = 'MEMO_004',

  // Bible (BIBLE_XXX)
  BIBLE_NOT_FOUND = 'BIBLE_001',
  BIBLE_VERSE_NOT_FOUND = 'BIBLE_002',
  BIBLE_SEARCH_FAILED = 'BIBLE_003',

  // General (GEN_XXX)
  UNKNOWN_ERROR = 'GEN_001',
  NETWORK_ERROR = 'GEN_002',
  PERMISSION_DENIED = 'GEN_003',
}

/**
 * 에러 코드별 기본 메시지
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Database
  [ErrorCode.DB_INIT_FAILED]: '데이터베이스 초기화에 실패했습니다.',
  [ErrorCode.DB_QUERY_FAILED]: '데이터베이스 쿼리 실행에 실패했습니다.',
  [ErrorCode.DB_NOT_FOUND]: '데이터를 찾을 수 없습니다.',
  [ErrorCode.DB_TRANSACTION_FAILED]: '데이터베이스 트랜잭션에 실패했습니다.',
  [ErrorCode.DB_EXPORT_FAILED]: '데이터 내보내기에 실패했습니다.',
  [ErrorCode.DB_IMPORT_FAILED]: '데이터 가져오기에 실패했습니다.',

  // Auth
  [ErrorCode.AUTH_INVALID_PASSWORD]: '비밀번호가 올바르지 않습니다.',
  [ErrorCode.AUTH_BIOMETRIC_FAILED]: '생체인식 인증에 실패했습니다.',
  [ErrorCode.AUTH_BIOMETRIC_NOT_AVAILABLE]: '생체인식을 사용할 수 없습니다.',
  [ErrorCode.AUTH_PASSWORD_NOT_SET]: '비밀번호가 설정되지 않았습니다.',
  [ErrorCode.AUTH_PASSWORD_MISMATCH]: '비밀번호가 일치하지 않습니다.',

  // Encryption
  [ErrorCode.ENCRYPT_FAILED]: '암호화에 실패했습니다.',
  [ErrorCode.DECRYPT_FAILED]: '복호화에 실패했습니다.',
  [ErrorCode.KEY_NOT_FOUND]: '암호화 키를 찾을 수 없습니다.',
  [ErrorCode.KEY_GENERATION_FAILED]: '암호화 키 생성에 실패했습니다.',

  // Share
  [ErrorCode.SHARE_CAPTURE_FAILED]: '이미지 캡처에 실패했습니다.',
  [ErrorCode.SHARE_NOT_AVAILABLE]: '공유 기능을 사용할 수 없습니다.',
  [ErrorCode.SHARE_FILE_ERROR]: '파일 처리 중 오류가 발생했습니다.',

  // Validation
  [ErrorCode.VALIDATION_REQUIRED]: '필수 입력 항목입니다.',
  [ErrorCode.VALIDATION_FORMAT]: '올바른 형식이 아닙니다.',
  [ErrorCode.VALIDATION_LENGTH]: '길이가 올바르지 않습니다.',

  // Memo
  [ErrorCode.MEMO_NOT_FOUND]: '메모를 찾을 수 없습니다.',
  [ErrorCode.MEMO_CREATE_FAILED]: '메모 생성에 실패했습니다.',
  [ErrorCode.MEMO_UPDATE_FAILED]: '메모 수정에 실패했습니다.',
  [ErrorCode.MEMO_DELETE_FAILED]: '메모 삭제에 실패했습니다.',

  // Bible
  [ErrorCode.BIBLE_NOT_FOUND]: '성경을 찾을 수 없습니다.',
  [ErrorCode.BIBLE_VERSE_NOT_FOUND]: '구절을 찾을 수 없습니다.',
  [ErrorCode.BIBLE_SEARCH_FAILED]: '검색에 실패했습니다.',

  // General
  [ErrorCode.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
  [ErrorCode.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
  [ErrorCode.PERMISSION_DENIED]: '권한이 거부되었습니다.',
};

/**
 * 앱 커스텀 에러 클래스
 */
export class AppError extends Error {
  code: ErrorCode;
  originalError?: Error;

  constructor(code: ErrorCode, message?: string, originalError?: Error) {
    super(message ?? ERROR_MESSAGES[code]);
    this.code = code;
    this.name = 'AppError';
    this.originalError = originalError;

    // ES5 호환성을 위한 프로토타입 체인 복원
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 에러 정보를 객체로 변환
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      originalError: this.originalError?.message,
    };
  }
}

/**
 * 에러가 AppError인지 확인
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 일반 에러를 AppError로 래핑
 */
export function wrapError(error: unknown, code?: ErrorCode): AppError {
  if (isAppError(error)) {
    return error;
  }

  const originalError = error instanceof Error ? error : new Error(String(error));
  return new AppError(
    code ?? ErrorCode.UNKNOWN_ERROR,
    originalError.message,
    originalError
  );
}
