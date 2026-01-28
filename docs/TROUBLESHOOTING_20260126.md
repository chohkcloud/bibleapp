# BibleApp 트러블슈팅 기록 (2026-01-26)

## 문제 현상
앱이 에뮬레이터에서 **스플래시 화면(bible-app 로고)에서 멈춤**
- 번들링 100% 완료
- 화면 중앙에 로고만 표시되고 더 이상 진행 안 됨

## 원인 분석

### 1차 원인: Out of Memory (OOM)
- 성경 데이터 11개 버전 × 31,102절 = 342,000+ 객체
- 앱 시작 시 정적 import로 모든 데이터가 메모리에 로드됨

### 2차 원인: databaseService 초기화 중 멈춤
`src/core/App.tsx`에서 `databaseService.initialize()` 호출 시 무한 대기

```typescript
// App.tsx:18
await databaseService.initialize();  // ← 여기서 멈춤
```

## 수정 완료 사항

### 1. bundledBibleService.ts - 동적 로딩 적용 (완료)
```typescript
// 정적 import 제거, 동적 require 사용
function loadBibleVersionSync(versionId: string): BundledVerse[] {
  if (loadedBibles.has(versionId)) return loadedBibles.get(versionId)!;
  switch (versionId) {
    case 'HCV': data = require('../data/versions/bundled/hcv.json'); break;
    // ...
  }
}
```

### 2. database/index.ts - 동적 로딩 적용 (완료)
```typescript
// 기존 (OOM 원인):
import otPart1 from '../../data/bible/ot_part1.json';
import otPart2 from '../../data/bible/ot_part2.json';
import ntData from '../../data/bible/nt.json';
const allBibleVerses = [...otPart1, ...otPart2, ...ntData];

// 수정 후 (동적 로딩):
// insertVersesFromData() 내부에서 필요할 때만 require()
const parts = [
  { name: 'OT Part 1', loader: () => require('../../data/bible/ot_part1.json') },
  { name: 'OT Part 2', loader: () => require('../../data/bible/ot_part2.json') },
  { name: 'NT', loader: () => require('../../data/bible/nt.json') },
];
```

### 3. ARCHITECTURE.md - 메모리 최적화 전략 문서 추가 (완료)

## 미해결 문제

### 앱이 스플래시에서 멈추는 현상
- Metro 번들링은 100% 완료
- JS 로그에 에러 없음
- `databaseService.initialize()` 단계에서 응답 없음

### 의심되는 원인
1. **expo-sqlite 초기화 문제** - 에뮬레이터에서 DB 생성 시 블로킹
2. **31,102절 INSERT 작업** - 첫 실행 시 대량 INSERT로 인한 타임아웃
3. **Metro 캐시 문제** - 이전 빌드 캐시와 충돌

## 내일 확인할 사항

1. **Metro 캐시 완전 삭제 후 재시작**
   ```bash
   cd bible-app
   rm -rf node_modules/.cache
   npx expo start --clear
   ```

2. **에뮬레이터 앱 데이터 삭제**
   - Expo Go 앱 데이터/캐시 삭제
   - 또는 에뮬레이터 완전 초기화 (wipe data)

3. **DB 초기화 로직 디버깅**
   - `FORCE_DB_RECREATE = true` 설정 후 테스트
   - 또는 기존 bible.db 삭제 후 재생성

4. **Console 로그 추가**
   ```typescript
   // database/index.ts의 각 단계에 로그 추가
   console.log('[DB] Step 1: initBibleDb 시작');
   console.log('[DB] Step 2: createBibleSchema 완료');
   console.log('[DB] Step 3: insertVersesFromData 시작');
   ```

## Git 상태 (커밋 안 됨)
```
modified:   src/services/database/index.ts  ← 동적 로딩 적용
modified:   docs/ARCHITECTURE.md            ← 메모리 최적화 문서 추가
+ untracked: docs/TROUBLESHOOTING_20260126.md
```

## 환경 정보
- 에뮬레이터: Pixel_6 (emulator-5554)
- Expo: 54.0.30
- 포트: 8082
- Platform: Windows 11
