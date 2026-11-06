@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  echo Python 3.11 or newer is required. Install it from https://www.python.org/downloads/windows/
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo Creating OrbitPilot AI environment...
  py -3 -m venv .venv
  if errorlevel 1 goto failed
)
echo Installing application requirements...
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto failed
echo.
echo Starting OrbitPilot AI on this computer only...
echo Open http://127.0.0.1:8765 in your browser.
echo Press Ctrl+C in this window to stop the app.
".venv\Scripts\python.exe" -m uvicorn orbitpilot.main:app --host 127.0.0.1 --port 8765
pause
exit /b 0
:failed
echo Installation failed. Check the error above and try again.
pause
exit /b 1
