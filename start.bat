@echo off
echo ==============================================
echo     FitCast - Weather-Aware Outfit Picker     
echo ==============================================

cd /d "%~dp0"

echo [1/2] Launching Backend Server on http://127.0.0.1:8000 ...
start "FitCast Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Frontend on http://localhost:3000 ...
cd frontend
npm.cmd run dev
