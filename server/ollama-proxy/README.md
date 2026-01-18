# Ollama Proxy Server 설정

## 파일 설명

| 파일 | 설명 |
|------|------|
| `start-ollama.bat` | Ollama 서버 시작 스크립트 (OLLAMA_HOST 환경변수 포함) |

## 사용 방법

### 수동 실행
```cmd
start-ollama.bat
```
또는 파일을 더블클릭하여 실행

### 환경변수 설정 내용
- **OLLAMA_HOST**: `0.0.0.0:11434`
- 모든 네트워크 인터페이스에서 접속 허용 (LAN 내 다른 기기에서 접근 가능)

---

## Windows 시작 시 자동 실행 설정

### 방법 1: 시작 프로그램 폴더 (권장)

1. `Win + R` 키를 누르고 `shell:startup` 입력 후 Enter
2. 시작 프로그램 폴더가 열림
3. `start-ollama.bat` 파일의 바로가기를 해당 폴더에 복사

**바로가기 만들기:**
```cmd
:: 관리자 권한으로 CMD 실행 후
mklink "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\start-ollama.lnk" "C:\claude\claudeproject\bibleapp\server\ollama-proxy\start-ollama.bat"
```

### 방법 2: 작업 스케줄러

1. `Win + R` → `taskschd.msc` 입력
2. "기본 작업 만들기" 클릭
3. 이름: `Ollama Server`
4. 트리거: "컴퓨터 시작 시"
5. 동작: "프로그램 시작"
6. 프로그램: `C:\claude\claudeproject\bibleapp\server\ollama-proxy\start-ollama.bat`
7. "마침" 클릭

### 방법 3: Windows 서비스 등록 (NSSM 사용)

```cmd
:: NSSM 설치 (Chocolatey 사용 시)
choco install nssm

:: 서비스 등록
nssm install OllamaServer "C:\claude\claudeproject\bibleapp\server\ollama-proxy\start-ollama.bat"

:: 서비스 시작
nssm start OllamaServer
```

---

## 참고사항

- Ollama 기본 포트: `11434`
- API 엔드포인트: `http://localhost:11434/api/`
- 모델 목록 확인: `ollama list`
- 모델 다운로드: `ollama pull llama3.2`

## 문제 해결

### 포트 충돌 시
```cmd
netstat -ano | findstr :11434
taskkill /PID <PID> /F
```

### 환경변수 확인
```cmd
echo %OLLAMA_HOST%
```
