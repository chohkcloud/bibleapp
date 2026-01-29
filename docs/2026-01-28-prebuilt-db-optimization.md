# BibleApp 작업 문서

**작업일**: 2026-01-28
**작업자**: Claude Code

---

## 1. Pre-built Database 시도 및 롤백

### 1.1 문제 상황

**증상**:
- 앱 첫 실행 시 로딩 화면에서 멈추거나 크래시 발생
- 에뮬레이터와 실제 기기 모두에서 동일 증상

**원인 분석**:
기존 코드는 앱 초기화 시 다음 작업을 런타임에 수행:
- 3개의 JSON 파일 로드 (총 5.8MB)
  - `ot_part1.json`: 3.07 MB (16,400절)
  - `ot_part2.json`: 1.37 MB (6,745절)
  - `nt.json`: 1.43 MB (7,957절)
- SQLite 테이블 생성
- **31,102개의 INSERT 문 실행**

### 1.2 시도한 해결책: Pre-built Database

빌드 시점에 미리 SQLite 데이터베이스를 생성하고, 앱 실행 시 assets에서 복사만 수행하는 방식 시도.

**구현 내용**:
- `scripts/buildBibleDb.js` 생성 (JSON → SQLite 변환)
- `assets/bible.db` 생성 (약 11MB)
- `metro.config.js` 수정 (`.db` 확장자 asset 포함)
- `expo-asset`으로 DB 파일 복사

### 1.3 결과: 프로덕션 빌드에서 실패

**문제점**:
- 개발 환경에서는 정상 작동
- **프로덕션 APK에서 성경 본문이 표시되지 않음**
- 검색 결과도 없음
- `expo-asset`의 `Asset.fromModule()` 방식이 프로덕션 빌드에서 DB 파일을 제대로 처리하지 못함

### 1.4 최종 결정: JSON 로딩 방식으로 롤백

**파일**: `src/services/database/index.ts`

```typescript
private async insertVersesFromData(): Promise<void> {
  // 동적 import로 JSON 데이터 로드
  const [otPart1Module, otPart2Module, ntModule] = await Promise.all([
    import('../../data/bible/ot_part1.json'),
    import('../../data/bible/ot_part2.json'),
    import('../../data/bible/nt.json'),
  ]);

  // 배치 단위로 INSERT 실행
  await this.insertVerseBatch(otPart1, '구약 1부');
  await this.insertVerseBatch(otPart2, '구약 2부');
  await this.insertVerseBatch(ntData, '신약');
}
```

**롤백 후 정상 작동 확인됨** (APK 재설치 필요)

---

## 2. expo-file-system API 변경 대응

### 문제

Expo SDK 54에서 `expo-file-system`의 `getInfoAsync` 등이 deprecated

**에러 메시지**:
```
오류: Method getInfoAsync imported from "expo-file-system" is deprecated.
```

### 해결

```typescript
// 변경 전
const FileSystem = require('expo-file-system');

// 변경 후
const FileSystem = require('expo-file-system/legacy');
```

**참고**: `expo-file-system/legacy` API는 향후 버전에서 제거될 수 있음. 새로운 File/Directory API로 마이그레이션 검토 필요.

---

## 3. Choco AI 서버 URL 영구 저장 기능 추가

### 문제

스마트폰에서 Choco AI 설정 화면에서 서버 URL을 입력해도 앱 재시작 후 초기화됨.

**원인**: 서버 URL이 메모리 변수(`customServerUrl`)에만 저장되고 영구 저장소에 저장되지 않음.

### 해결

**파일**: `src/services/chocoAI/chocoAIConfig.ts`

```typescript
const SERVER_URL_KEY = 'choco_server_url';

export const saveServerUrl = async (url: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(SERVER_URL_KEY, url);
    customServerUrl = url;  // 메모리에도 반영
    return true;
  } catch (error) {
    console.error('[ChocoAI] Server URL 저장 실패:', error);
    return false;
  }
};

export const loadServerUrl = async (): Promise<string | null> => {
  try {
    const url = await SecureStore.getItemAsync(SERVER_URL_KEY);
    if (url) {
      customServerUrl = url;  // 메모리에 반영
    }
    return url;
  } catch (error) {
    console.error('[ChocoAI] Server URL 불러오기 실패:', error);
    return null;
  }
};

export const initializeServerUrl = async (): Promise<void> => {
  await loadServerUrl();
};
```

**파일**: `src/services/chocoService.ts`

```typescript
async initialize(): Promise<void> {
  if (this.isInitialized) return;
  await loadServerUrl();  // 저장된 URL 로드
  this.isInitialized = true;
}
```

**파일**: `src/screens/settings/ChocoAISettingsScreen.tsx`

- `handleSave`에서 `saveServerUrl()` 호출
- `loadSettings`에서 `loadServerUrl()` 호출

---

## 4. 빌드 이력

| 빌드 ID | 상태 | 설명 | APK URL |
|---------|------|------|---------|
| `rkefFcYyRpPqVBUNSz93x1` | 성공 | Pre-built DB 버전 | (deprecated) |
| `kizXNgeBzLF2vUVJqAgyQy` | 성공 | expo-file-system/legacy 수정 | (deprecated) |
| `5w4xpvRAMBJPMpAueEV1nt` | **성공** | **JSON 로딩 롤백 (최종)** | https://expo.dev/artifacts/eas/5w4xpvRAMBJPMpAueEV1nt.apk |

---

## 5. 중요 참고사항

### DB 전략 변경 시 앱 재설치 필요

기존 앱에서 `bible.db`가 이미 생성되어 있으면, 새 빌드에서 JSON 데이터를 다시 삽입하지 않음.

```typescript
// database/index.ts:79-85
if (!fileInfo.exists) {
  // DB가 없을 때만 데이터 삽입
  await this.insertAllBibleData();
} else {
  // DB가 이미 있으면 그냥 열기만 함
  this.bibleDb = await SQLite.openDatabaseAsync('bible.db');
}
```

**해결**: 앱 **완전 삭제 후 재설치** 필요

---

## 6. 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/services/database/index.ts` | JSON 로딩 방식으로 롤백, `expo-file-system/legacy` 사용 |
| `src/services/chocoAI/chocoAIConfig.ts` | 서버 URL 영구 저장 기능 추가 |
| `src/services/chocoAI/index.ts` | 새 함수 export 추가 |
| `src/services/chocoService.ts` | 초기화 시 서버 URL 로드 |
| `src/screens/settings/ChocoAISettingsScreen.tsx` | 저장/로드 함수 사용 |

---

## 7. 향후 과제

1. **Pre-built DB 방식 재검토**: `expo-asset` 대신 다른 방식으로 DB 번들링 시도 가능
   - `eas.json`의 `android.buildVariables`에서 DB 경로 지정
   - Native module로 DB 복사

2. **expo-file-system 마이그레이션**: `/legacy` API 제거 전 새 API로 전환 필요
   - https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/

3. **앱 버전 관리**: DB 스키마 변경 시 버전 체크 및 자동 마이그레이션 로직 추가 검토
