@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title OrbitPilot AI - Build single EXE

echo Building the single-file OrbitPilotAI.exe for 64-bit Windows.
echo This build script is for maintainers; the finished app does not need Python.
echo.

set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if exist "%PYTHON_EXE%" goto python_found

where py >nul 2>&1
if not errorlevel 1 (
  py -3.12 -c "import sys; print(sys.executable)" > "%TEMP%\orbitpilot-python-path.txt" 2>nul
  if not errorlevel 1 set /p PYTHON_EXE=<"%TEMP%\orbitpilot-python-path.txt"
)
if exist "%PYTHON_EXE%" goto python_found

set "PYTHON_INSTALLER=%TEMP%\orbitpilot-python-3.12.10-amd64.exe"
echo Python 3.12 was not found. Downloading the official Python installer...
powershell.exe -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri 'https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe' -OutFile '%PYTHON_INSTALLER%'"
if errorlevel 1 goto failed
if not exist "%PYTHON_INSTALLER%" goto failed
"%PYTHON_INSTALLER%" /quiet InstallAllUsers=0 TargetDir="%LOCALAPPDATA%\Programs\Python\Python312" Include_pip=1 Include_launcher=0 Include_test=0 Shortcuts=0 PrependPath=0
if errorlevel 1 goto failed
set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if not exist "%PYTHON_EXE%" goto failed

:python_found
if not exist ".build-env-py312\Scripts\python.exe" (
  "%PYTHON_EXE%" -m venv ".build-env-py312"
  if errorlevel 1 goto failed
)
set "BUILD_PY=%CD%\.build-env-py312\Scripts\python.exe"
"%BUILD_PY%" -c "import sys; raise SystemExit(0 if sys.version_info[:2] == (3, 12) else 1)"
if errorlevel 1 (
  echo ERROR: the dedicated build environment must use Python 3.12.
  goto failed
)

"%BUILD_PY%" -m pip install --upgrade pip
if errorlevel 1 goto failed
"%BUILD_PY%" -m pip install -r requirements-build.txt
if errorlevel 1 goto failed
"%BUILD_PY%" -m compileall -q desktop_launcher.py orbitpilot
if errorlevel 1 goto failed
"%BUILD_PY%" scripts\create_icon.py
if errorlevel 1 goto failed

if not exist "build-assets" mkdir "build-assets"
powershell.exe -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri 'https://go.microsoft.com/fwlink/p/?LinkId=2124703' -OutFile 'build-assets\MicrosoftEdgeWebView2Setup.exe'"
if errorlevel 1 goto failed

set "PYINSTALLER_WORK=%TEMP%\OrbitPilotAI-build-%RANDOM%-%RANDOM%"
"%BUILD_PY%" -m PyInstaller --noconfirm --clean --workpath "%PYINSTALLER_WORK%" OrbitPilotAI.spec
if errorlevel 1 goto failed
if not exist "dist\OrbitPilotAI.exe" goto failed

echo.
echo Smoke-testing the bundled app and dashboard...
"dist\OrbitPilotAI.exe" --smoke-test
if errorlevel 1 goto failed
"%BUILD_PY%" scripts\package_windows.py
if errorlevel 1 goto failed

echo.
echo SUCCESS: the distributables are:
echo %CD%\dist\OrbitPilotAI.exe
echo %CD%\dist\OrbitPilotAI-Complete.zip
echo.
pause
exit /b 0

:failed
echo.
echo BUILD FAILED. Check the error messages above.
pause
exit /b 1
