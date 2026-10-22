@echo off
rem Change directory to the script location
cd /d "%~dp0"

echo Installing dependencies...
npm install --legacy-peer-deps
if errorlevel 1 (
  echo npm install failed
  pause
  exit /b 1
)

echo Starting development server...
npm run dev

pause
