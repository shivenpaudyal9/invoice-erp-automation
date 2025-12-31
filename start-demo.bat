@echo off
echo ========================================
echo    Invoice-to-ERP Automation System
echo    Starting Demo Environment...
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "Backend - FastAPI" cmd /k "cd /d C:\Users\91953\invoice-erp-automation\backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Server...
start "Frontend - React" cmd /k "cd /d C:\Users\91953\invoice-erp-automation\frontend && npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo    Servers Starting...
echo ========================================
echo.
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:5173
echo    API Docs: http://localhost:8000/docs
echo.
echo    Opening browser in 5 seconds...
echo ========================================

timeout /t 5 /nobreak > nul

start http://localhost:5173

echo.
echo Press any key to exit this window...
pause > nul
