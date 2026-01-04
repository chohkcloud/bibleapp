# ReadingScreen 헤더 상태바 간섭 수정

> 성경 읽기 화면의 헤더가 상태바와 겹쳐서 버튼이 눌리지 않는 문제 해결

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 디버그_ReadingScreen헤더수정_20260103_1542.md |
| 카테고리 | 디버그 |
| 생성일시 | 2026-01-03 15:42 KST |
| 작성자 | Claude |
| 버전 | v1.0.0 |
| 위치 | `C:/claude/claudeproject/bibleapp/docs/디버그_ReadingScreen헤더수정_20260103_1542.md` |

---

## 목차

1. [문제 상황](#1-문제-상황)
2. [원인 분석](#2-원인-분석)
3. [해결 방법](#3-해결-방법)
4. [수정된 파일](#4-수정된-파일)
5. [결과](#5-결과)

---

## 1. 문제 상황

### 증상
- 성경 읽기 화면(ReadingScreen)에서 상단 헤더의 "뒤로", "목록" 버튼이 눌리지 않음
- 헤더가 안드로이드 상태바와 겹쳐서 터치 이벤트가 간섭됨

### 재현 경로
1. 앱 실행
2. 하단 탭에서 "성경" 선택
3. 책(예: 창세기) 선택
4. 장(예: 1장) 선택하여 ReadingScreen 진입
5. 상단 헤더의 버튼 터치 시도 → 반응 없음

---

## 2. 원인 분석

### 기존 구조
- React Navigation의 Native Stack Navigator 기본 헤더 사용
- `headerStatusBarHeight` 옵션으로 조정 시도했으나 적용되지 않음

### 문제점
- Native Stack Navigator의 헤더는 상태바 영역을 자동으로 처리하지만, 안드로이드 에뮬레이터에서 상태바와 겹침 발생
- `BibleStack.tsx`의 `screenOptions`에서 `headerStatusBarHeight` 설정이 ReadingScreen에 적용되지 않음

---

## 3. 해결 방법

### 접근 방식
기본 네비게이션 헤더를 숨기고, 상태바 높이를 계산한 커스텀 헤더를 직접 구현

### 수정 내용

#### 3.1 상태바 높이 계산
```typescript
import { Platform, StatusBar } from 'react-native';

const STATUSBAR_HEIGHT = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24)
  : 44;
```

#### 3.2 기본 헤더 숨기기
```typescript
useLayoutEffect(() => {
  navigation.setOptions({
    headerShown: false,
  });
}, [navigation]);
```

#### 3.3 커스텀 헤더 구현
```tsx
<View style={[styles.customHeader, {
  paddingTop: STATUSBAR_HEIGHT + 10,
  backgroundColor: colors.background,
  borderBottomColor: colors.border
}]}>
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => navigation.goBack()}
  >
    <Text style={[styles.backButtonText, { color: colors.primary }]}>
      ← 뒤로
    </Text>
  </TouchableOpacity>
  <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
    {bookName} {chapter}장
  </Text>
  <TouchableOpacity
    style={styles.listButton}
    onPress={() => navigation.navigate('ChapterSelect', {
      bookId, bookName, chapters: totalChapters
    })}
  >
    <Text style={[styles.listButtonText, { color: colors.primary }]}>
      목록
    </Text>
  </TouchableOpacity>
</View>
```

#### 3.4 커스텀 헤더 스타일
```typescript
customHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingBottom: 12,
  borderBottomWidth: 1,
},
backButton: {
  paddingVertical: 8,
  paddingRight: 12,
},
backButtonText: {
  fontSize: 16,
  fontWeight: '500',
},
headerTitle: {
  flex: 1,
  fontSize: 18,
  fontWeight: 'bold',
  textAlign: 'center',
},
listButton: {
  paddingVertical: 8,
  paddingLeft: 12,
},
listButtonText: {
  fontSize: 16,
  fontWeight: '500',
},
```

---

## 4. 수정된 파일

| 파일 | 위치 | 변경 내용 |
|------|------|----------|
| ReadingScreen.tsx | `src/screens/bible/` | 커스텀 헤더 구현, 기본 헤더 숨김 |
| BibleStack.tsx | `src/navigation/` | headerStatusBarHeight 설정 추가 (참고용) |

### ReadingScreen.tsx 주요 변경사항

1. **import 추가**
   - `Platform`, `StatusBar` from 'react-native'

2. **상수 추가**
   - `STATUSBAR_HEIGHT`: 상태바 높이 계산

3. **useLayoutEffect 수정**
   - `headerShown: false`로 기본 헤더 숨김

4. **JSX 구조 변경**
   - `SafeContainer` → `View`로 변경 (메인 return)
   - 커스텀 헤더 View 추가 (상태바 아래 위치)

5. **스타일 추가**
   - `customHeader`, `backButton`, `backButtonText`
   - `headerTitle`, `listButton`, `listButtonText`

---

## 5. 결과

### 해결 확인
- 커스텀 헤더가 상태바 아래에 정상 위치
- "← 뒤로" 버튼 터치 시 이전 화면으로 정상 이동
- "목록" 버튼 터치 시 장 선택 화면으로 정상 이동

### 헤더 여백
- `STATUSBAR_HEIGHT + 10`: 상태바 높이 + 10px 여백
- 필요 시 여백 값 조정 가능

---

## 관련 문서

- bibleapp_WBS.md - 작업 진행 관리
- 신규생성_전체성경데이터통합_20260103_1400.md - 이전 작업
