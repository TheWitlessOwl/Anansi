@echo off
cd /d "%~dp0"
set PORT=5173

echo Starting dev server...

REM Start server inline (shows logs in same window)
start /b cmd /c "npm run dev"

echo Waiting for server...
timeout /t 3 >nul

echo Opening Chrome...
start "" "chrome.exe" "http://localhost:%PORT%"

pause
