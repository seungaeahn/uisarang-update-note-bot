@echo off
chcp 65001 > nul
echo.
echo  의사랑 업데이트 노트 작성 도구를 시작합니다...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [오류] Node.js가 설치되어 있지 않아요.
  echo  https://nodejs.org 에서 LTS 버전을 설치한 후 다시 실행해 주세요.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  패키지를 설치하는 중... (최초 1회만 실행됩니다)
  npm install
  echo.
)

echo  브라우저에서 http://localhost:5173 으로 접속하세요.
echo  같은 네트워크의 팀원은 이 PC의 IP 주소로 접속할 수 있어요.
echo  (예: http://192.168.x.x:5173)
echo  종료하려면 이 창을 닫으세요.
echo.
npm run dev
