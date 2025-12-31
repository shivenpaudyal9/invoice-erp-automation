@echo off
echo Stopping all demo servers...

taskkill /FI "WINDOWTITLE eq Backend - FastAPI*" /F 2>nul
taskkill /FI "WINDOWTITLE eq Frontend - React*" /F 2>nul

echo.
echo All servers stopped.
pause
