@echo off
chcp 65001 >nul
echo ========================================
echo   Ollama Server Startup Script
echo ========================================
echo.

:: OLLAMA_HOST 환경변수 설정 (현재 세션)
set OLLAMA_HOST=0.0.0.0:11434
echo [INFO] OLLAMA_HOST 환경변수 설정: %OLLAMA_HOST%

:: 시스템 환경변수로 영구 설정 (관리자 권한 필요)
echo.
echo [INFO] 시스템 환경변수 영구 설정 중...
setx OLLAMA_HOST "0.0.0.0:11434" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] 시스템 환경변수가 영구적으로 설정되었습니다.
) else (
    echo [WARN] 시스템 환경변수 설정 실패 - 관리자 권한으로 실행해주세요.
)

echo.
echo ========================================
echo   Ollama 서비스 시작
echo ========================================
echo.

:: Ollama 서비스 시작
echo [INFO] Ollama 서비스를 시작합니다...
echo [INFO] 종료하려면 Ctrl+C를 누르세요.
echo.

ollama serve

:: 서비스 종료 시 메시지
echo.
echo [INFO] Ollama 서비스가 종료되었습니다.
pause
