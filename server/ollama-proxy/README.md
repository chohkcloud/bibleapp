# Ollama Proxy Server

Docker 기반 Nginx 리버스 프록시로 Ollama API를 보호합니다.

## 기능

- **API Key 인증**: X-API-Key 헤더 검증
- **Rate Limiting**: 분당 30 요청 제한 (burst 10)
- **엔드포인트 제한**: `/api/generate`, `/api/chat`만 허용
- **CORS 지원**: 모바일 앱 크로스 오리진 요청 허용
- **요청 로깅**: 모든 API 요청 기록
- **헬스 체크**: `/health`, `/status` 엔드포인트

## 파일 구조

```
ollama-proxy/
├── docker-compose.yml    # Docker Compose 설정
├── nginx/
│   └── nginx.conf        # Nginx 설정 (템플릿)
├── logs/                 # 로그 디렉토리 (자동 생성)
├── .env.example          # 환경변수 예시
├── .env                  # 실제 환경변수 (생성 필요)
├── start-ollama.bat      # Ollama 서버 시작 스크립트
└── README.md             # 이 파일
```

---

## 빠른 시작

### 1. 사전 요구사항

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- Ollama 설치 및 실행 (`start-ollama.bat` 사용)

### 2. 환경 설정

```cmd
cd C:\claude\claudeproject\bibleapp\bible-app\server\ollama-proxy

:: .env 파일 생성
copy .env.example .env

:: .env 파일을 편집하여 CHOCO_API_KEY 설정
notepad .env
```

### 3. API Key 생성

PowerShell에서 실행:
```powershell
# 32자 랜덤 키 생성
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 4. 서비스 시작

```cmd
:: Ollama 서버 먼저 시작 (별도 터미널)
start-ollama.bat

:: Docker 컨테이너 시작
docker-compose up -d
```

### 5. 테스트

```cmd
:: 헬스 체크
curl http://localhost:8080/health

:: API 테스트 (API Key 필요)
curl -X POST http://localhost:8080/api/generate ^
  -H "Content-Type: application/json" ^
  -H "X-API-Key: YOUR_API_KEY" ^
  -d "{\"model\": \"llama3.2\", \"prompt\": \"Hello\"}"
```

---

## API 사용법

### 헤더

모든 API 요청에 다음 헤더 필수:
```
X-API-Key: your-api-key-here
Content-Type: application/json
```

### 엔드포인트

| 엔드포인트 | 메소드 | 인증 | 설명 |
|-----------|--------|------|------|
| `/health` | GET | 불필요 | 서비스 상태 확인 |
| `/status` | GET | 불필요 | 프록시 상태 정보 |
| `/api/generate` | POST | 필요 | 텍스트 생성 |
| `/api/chat` | POST | 필요 | 채팅 완성 |

### 응답 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 401 | API Key 누락 또는 잘못됨 |
| 403 | 허용되지 않은 엔드포인트 |
| 404 | 존재하지 않는 경로 |
| 429 | Rate limit 초과 (분당 30회) |

---

## Docker 명령어

```cmd
:: 시작
docker-compose up -d

:: 중지
docker-compose down

:: 로그 확인
docker-compose logs -f

:: 재시작
docker-compose restart

:: 상태 확인
docker-compose ps
```

## 로그 확인

```cmd
:: Nginx 액세스 로그
type logs\access.log

:: Nginx 에러 로그
type logs\error.log

:: 실시간 로그 모니터링
docker-compose logs -f ollama-proxy
```

---

## Ollama 서버 설정

### start-ollama.bat

`start-ollama.bat`을 실행하면:
- OLLAMA_HOST 환경변수를 `0.0.0.0:11434`로 설정
- Ollama 서비스 시작
- 모든 네트워크 인터페이스에서 접속 허용

### Windows 시작 시 자동 실행

1. `Win + R` → `shell:startup` 입력
2. `start-ollama.bat` 파일의 바로가기를 해당 폴더에 복사

---

## 문제 해결

### Ollama 연결 실패

```cmd
:: Ollama 실행 확인
curl http://localhost:11434/api/tags

:: 환경변수 확인
echo %OLLAMA_HOST%
```

### Docker 네트워크 문제

```cmd
:: Docker Desktop 실행 확인
docker info

:: 컨테이너에서 호스트 연결 테스트
docker exec ollama-proxy wget -q -O- http://host.docker.internal:11434/api/tags
```

### Rate Limit 초과

- 분당 30 요청까지 허용
- Burst: 순간적으로 10 요청 추가 허용
- 초과 시 60초 대기 후 재시도

---

## 보안 권장사항

1. **강력한 API Key 사용**: 32자 이상의 랜덤 문자열
2. **.env 파일 보호**: Git에 커밋하지 않기
3. **프로덕션 환경**: HTTPS 적용 권장
4. **정기적 키 교체**: 보안을 위해 주기적으로 API Key 변경
