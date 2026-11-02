@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update-photos.ps1"
if errorlevel 1 echo.
if errorlevel 1 echo Failed. Please check the folder path.
echo.
pause
