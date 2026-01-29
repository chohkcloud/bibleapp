# Expo 개발 환경 트러블슈팅 가이드

> Metro Bundler, 에뮬레이터 연결 문제 해결 방법

---

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | TROUBLESHOOTING_EXPO.md |
| 생성일시 | 2026-01-28 |
| 작성자 | Claude Code |

---

## 목차

1. [Metro Bundler 파일 감시 문제](#1-metro-bundler-파일-감시-문제)
2. [에뮬레이터 연결 문제 (adb reverse)](#2-에뮬레이터-연결-문제-adb-reverse)
3. [자주 발생하는 문제와 해결책](#3-자주-발생하는-문제와-해결책)
4. [배포용 빌드와 Metro Bundler](#4-배포용-빌드와-metro-bundler)
5. [외부 스마트폰에서 Choco API 접속](#5-외부-스마트폰에서-choco-api-접속)

---

## 1. Metro Bundler 파일 감시 문제

### 1.1 Metro Bundler란?

Metro Bundler는 React Native/Expo의 **JavaScript 번들러**입니다.

**주요 기능:**
- JavaScript/TypeScript 파일을 하나의 번들로 묶음
- **Hot Module Replacement (HMR)**: 파일 변경 시 자동 리로드
- 파일 시스템 감시 (File Watching)

### 1.2 파일 감시로 인한 문제

Metro가 실행 중일 때 발생할 수 있는 문제:

| 문제 | 원인 | 증상 |
|------|------|------|
| 파일 저장 실패 | Metro가 파일 핸들을 점유 | "파일이 다른 프로세스에서 사용 중" 오류 |
| 저장 시 지연 | 저장 즉시 리빌드 시작 | 에디터가 느려짐 |
| 메모리 사용량 증가 | 대용량 파일 감시 | 시스템 느려짐 |
| 무한 리빌드 | 빌드 출력물이 감시 대상에 포함 | CPU 100% |

### 1.3 해결 방법

#### 방법 1: Metro 임시 중지 후 파일 수정

```bash
# 1. Metro 서버 중지 (Ctrl+C)
# 2. 파일 수정
# 3. Metro 서버 재시작
npx expo start --clear
```

#### 방법 2: 특정 폴더 감시 제외 (metro.config.js)

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 감시 제외할 폴더 설정
config.watchFolders = [];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules/,
  /\.git\/.*/,
  /android\/.*/,
  /ios\/.*/,
];

module.exports = config;
```

#### 방법 3: 대용량 JSON 파일 처리

대용량 데이터 파일(성경 데이터 등)은 **assets 폴더**로 이동:

```
src/data/versions/bundled/  → 번들에 포함됨 (Metro 감시 O)
assets/data/                → 별도 로드 (Metro 감시 X, 권장)
```

---

## 2. 에뮬레이터 연결 문제 (adb reverse)

### 2.1 문제 상황

Expo 개발 서버 실행 후 에뮬레이터에서 앱 로딩 실패:

```
exp://192.168.219.104:8081 → 연결 실패
"Something went wrong" 또는 무한 로딩
```

### 2.2 원인

Android 에뮬레이터는 **별도의 가상 네트워크**에서 실행됩니다:

```
┌─────────────────────────────────────────────────────────────┐
│  PC (Host)                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────┐│
│  │ Metro Bundler       │    │ Android Emulator            ││
│  │ localhost:8081      │    │ (별도 가상 네트워크)         ││
│  │ 192.168.219.104:8081│    │                             ││
│  └─────────────────────┘    │  10.0.2.x (에뮬레이터 IP)   ││
│                              │  localhost ≠ PC localhost   ││
│                              └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**에뮬레이터 관점:**
- `localhost` = 에뮬레이터 자신 (PC가 아님!)
- `192.168.x.x` = 에뮬레이터가 접근할 수 없는 외부 네트워크
- `10.0.2.2` = PC의 localhost (특수 주소, 하지만 불안정)

### 2.3 해결 방법: adb reverse

`adb reverse`는 에뮬레이터의 포트를 PC의 포트로 **터널링**합니다:

```bash
adb reverse tcp:8081 tcp:8081
```

**동작 원리:**
```
[에뮬레이터]                    [PC]
localhost:8081  ────터널────>  localhost:8081 (Metro)
     ↑
   앱 요청
```

**설정 후:**
- `exp://127.0.0.1:8081` → 에뮬레이터의 localhost:8081
- → adb reverse 터널 통해 → PC의 localhost:8081 (Metro)
- → 정상 연결!

### 2.4 전체 실행 순서

```bash
# 1. 에뮬레이터 실행 확인
adb devices

# 2. 포트 포워딩 설정
adb reverse tcp:8081 tcp:8081

# 3. Expo 개발 서버 시작
cd bible-app
npx expo start --clear

# 4. 에뮬레이터에서 앱 열기
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"
```

### 2.5 자동화 스크립트

Windows PowerShell 스크립트 (`start-dev.ps1`):

```powershell
# start-dev.ps1
Write-Host "Setting up adb reverse..."
adb reverse tcp:8081 tcp:8081

Write-Host "Starting Expo..."
Set-Location -Path "C:\claude\claudeproject\bibleapp\bible-app"
npx expo start --android --clear
```

Windows Batch 스크립트 (`start-dev.bat`):

```batch
@echo off
echo Setting up adb reverse...
adb reverse tcp:8081 tcp:8081

echo Starting Expo...
cd /d C:\claude\claudeproject\bibleapp\bible-app
npx expo start --android --clear
```

---

## 3. 자주 발생하는 문제와 해결책

### 3.1 "Unable to resolve module" 오류

```bash
# 캐시 삭제 후 재시작
npx expo start --clear
```

### 3.2 에뮬레이터에서 앱이 크래시

```bash
# 로그 확인
adb logcat -d -t 100 *:E | grep -i "react\|expo\|fatal"

# 앱 데이터 초기화
adb shell pm clear host.exp.exponent
```

### 3.3 Metro 서버가 응답하지 않음

```bash
# 포트 사용 확인 (Windows)
netstat -ano | findstr :8081

# 프로세스 종료 후 재시작
taskkill /F /PID <PID>
npx expo start --clear
```

### 3.4 adb reverse 설정이 초기화됨

에뮬레이터 재시작 시 adb reverse 설정이 사라집니다:

```bash
# 에뮬레이터 재시작 후 다시 설정 필요
adb reverse tcp:8081 tcp:8081
```

### 3.5 여러 에뮬레이터/디바이스 사용 시

```bash
# 특정 디바이스 지정
adb -s emulator-5554 reverse tcp:8081 tcp:8081

# 디바이스 목록 확인
adb devices
```

---

## 요약 체크리스트

에뮬레이터에서 앱이 로드되지 않을 때:

- [ ] `adb devices`로 에뮬레이터 연결 확인
- [ ] `adb reverse tcp:8081 tcp:8081` 실행
- [ ] `exp://127.0.0.1:8081`로 연결 (192.168.x.x 아님!)
- [ ] Metro 서버가 실행 중인지 확인
- [ ] 캐시 문제 시 `npx expo start --clear`

---

## 4. 배포용 빌드와 Metro Bundler

### 4.1 개발 빌드 vs 배포 빌드

| 구분 | 개발 빌드 | 배포 빌드 |
|------|----------|----------|
| 명령어 | `npx expo start` | `eas build` |
| Metro Bundler | **실행됨** (실시간 번들링) | **사용 안 함** |
| JavaScript | Metro에서 실시간 제공 | **APK에 미리 포함** |
| 파일 감시 | O (HMR 지원) | **X** |
| 네트워크 필요 | O (개발 서버 연결) | **X** (독립 실행) |

### 4.2 배포 빌드의 동작 원리

```
개발 시:
┌─────────┐    HTTP     ┌─────────────┐
│   앱    │ ◄────────── │ Metro (PC)  │
└─────────┘   :8081     └─────────────┘
                         ↑ 파일 감시 O

배포 시:
┌─────────────────────────┐
│   APK/AAB               │
│  ┌───────────────────┐  │
│  │ bundle.js (미리   │  │  ← Metro 불필요
│  │ 번들링된 JS)      │  │  ← 파일 감시 X
│  └───────────────────┘  │  ← 독립 실행
└─────────────────────────┘
```

### 4.3 배포 빌드 생성

```bash
# EAS Build 사용 (권장)
eas build --platform android --profile production

# 또는 로컬 빌드
npx expo run:android --variant release
```

### 4.4 배포 빌드에서 API 엔드포인트 설정

배포 빌드에서는 **실제 서버 주소**를 사용해야 합니다:

```typescript
// src/services/chocoAI/chocoAIConfig.ts
const config = {
  // 개발 환경
  development: {
    baseUrl: 'http://192.168.219.104:5000',  // PC 로컬 서버
  },
  // 배포 환경
  production: {
    baseUrl: 'https://api.yourserver.com',   // 실제 서버
    // 또는
    // baseUrl: 'http://YOUR_PUBLIC_IP:5000', // 공인 IP
  },
};

export const API_BASE_URL = __DEV__
  ? config.development.baseUrl
  : config.production.baseUrl;
```

---

## 5. 외부 스마트폰에서 Choco API 접속

### 5.1 adb reverse의 한계

**중요:** `adb reverse`는 **에뮬레이터 전용**입니다!

| 디바이스 | adb reverse | 이유 |
|----------|-------------|------|
| 에뮬레이터 | O | 가상 네트워크 터널링 |
| USB 연결 폰 | △ (제한적) | USB 디버깅 필요, 불안정 |
| **WiFi 연결 폰** | **X** | USB 연결 없음 |

### 5.2 외부 스마트폰 연결 방법

#### 방법 1: 같은 WiFi 네트워크 + PC IP 사용

**조건:** 스마트폰과 PC가 같은 WiFi 네트워크에 연결

```
┌────────────────────────────────────────────────────┐
│  WiFi 공유기 (192.168.219.1)                       │
│                                                    │
│  ┌─────────────┐         ┌─────────────┐          │
│  │ PC          │         │ 스마트폰     │          │
│  │ 192.168.    │ ◄────── │ 192.168.    │          │
│  │ 219.104     │  HTTP   │ 219.xxx     │          │
│  │ :5000       │         │             │          │
│  └─────────────┘         └─────────────┘          │
└────────────────────────────────────────────────────┘
```

**설정 단계:**

```bash
# 1. PC IP 확인
ipconfig  # Windows
# 192.168.219.104 확인

# 2. Windows 방화벽에서 포트 열기
netsh advfirewall firewall add rule name="Choco API" dir=in action=allow protocol=tcp localport=5000

# 3. 앱에서 API URL 설정
# http://192.168.219.104:5000
```

**앱 설정:**

```typescript
// 앱의 API 설정
const CHOCO_API_URL = 'http://192.168.219.104:5000';
```

#### 방법 2: ngrok 터널링 (외부 네트워크에서 접속)

**조건:** 인터넷만 연결되면 어디서든 접속 가능

```bash
# 1. ngrok 설치
# https://ngrok.com/download

# 2. ngrok 실행
ngrok http 5000

# 3. 생성된 URL 사용
# https://xxxx-xx-xx-xxx-xxx.ngrok-free.app
```

```
┌─────────────────────────────────────────────────────────┐
│  인터넷                                                 │
│                                                         │
│  ┌─────────────┐   ngrok    ┌─────────────┐            │
│  │ PC          │ ◄──터널──► │ ngrok 서버   │            │
│  │ localhost   │            │ xxxx.ngrok.io│            │
│  │ :5000       │            └──────▲───────┘            │
│  └─────────────┘                   │                    │
│                                    │ HTTPS              │
│                           ┌────────┴────────┐           │
│                           │ 외부 스마트폰    │           │
│                           │ (어디서든 접속) │           │
│                           └─────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

**앱 설정:**

```typescript
// ngrok URL 사용
const CHOCO_API_URL = 'https://xxxx-xx-xx-xxx-xxx.ngrok-free.app';
```

#### 방법 3: 공유기 포트 포워딩 (영구 설정)

```
외부 인터넷 ──► 공유기 (공인IP:5000) ──► PC (192.168.219.104:5000)
```

**설정:**
1. 공유기 관리 페이지 접속 (보통 192.168.219.1)
2. 포트 포워딩 설정
3. 외부 포트 5000 → 내부 IP 192.168.219.104:5000

### 5.3 방법별 비교

| 방법 | 난이도 | 속도 | 외부 접속 | 보안 | 비용 |
|------|--------|------|----------|------|------|
| 같은 WiFi + PC IP | 쉬움 | 빠름 | X | 중 | 무료 |
| ngrok | 쉬움 | 느림 | O | 상 (HTTPS) | 무료/유료 |
| 포트 포워딩 | 어려움 | 빠름 | O | **낮음** | 무료 |

### 5.4 권장 설정

**개발 중:**
```typescript
const CHOCO_API_URL = __DEV__
  ? 'http://192.168.219.104:5000'  // 같은 WiFi
  : 'https://api.yourserver.com';   // 프로덕션 서버
```

**테스트용 ngrok:**
```typescript
// .env.local
EXPO_PUBLIC_CHOCO_API_URL=https://xxxx.ngrok-free.app
```

### 5.5 Windows 방화벽 설정 (PowerShell 관리자)

```powershell
# Choco API 포트 열기
netsh advfirewall firewall add rule name="Choco API 5000" dir=in action=allow protocol=tcp localport=5000

# Expo Metro 포트 열기 (개발용)
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=tcp localport=8081

# 규칙 확인
netsh advfirewall firewall show rule name="Choco API 5000"

# 규칙 삭제 (필요시)
netsh advfirewall firewall delete rule name="Choco API 5000"
```

### 5.6 연결 테스트

```bash
# PC에서 API 확인
curl http://localhost:5000/health

# 스마트폰에서 (같은 WiFi)
# 브라우저로 http://192.168.219.104:5000/health 접속

# ngrok 사용 시
curl https://xxxx.ngrok-free.app/health
```

---

## 문서 업데이트 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-28 | v1.0.0 | 최초 문서 생성 | Claude Code |
| 2026-01-28 | v1.1.0 | 배포 빌드, 외부 스마트폰 API 접속 추가 | Claude Code |
