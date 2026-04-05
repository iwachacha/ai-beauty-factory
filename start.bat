@echo off
echo ==========================================
echo AI Beauty Factory - Start Script
echo ==========================================

echo [1/4] Copying .env to backend...
copy /Y .env backend\.env >nul

echo [2/4] Building all backend libraries...
cd backend
call npx nx run-many -t build --skip-nx-cache
if %errorlevel% neq 0 (
  echo ERROR: Build failed
  pause
  exit /b 1
)

echo [3/4] Starting Backend Server...
start "AI Beauty Factory - Backend" cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File apps/factory-server/scripts/run-local.ps1"

echo [4/4] Starting Frontend Web Server...
cd ..
start "AI Beauty Factory - Web" cmd /k "cd web && npm run dev"

echo.
echo ==========================================
echo All tasks started!
echo Please wait a few seconds and then open your browser at:
echo http://localhost:6070
echo ==========================================
pause
