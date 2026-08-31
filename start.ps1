# FitCast Launcher for Windows PowerShell
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "    FitCast - Weather-Aware Outfit Picker     " -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan

$ROOT = $PSScriptRoot

# 1. Check Python Venv
if (!(Test-Path "$ROOT\backend\venv")) {
    Write-Host "[1/3] Creating Python virtual environment..." -ForegroundColor Green
    python -m venv "$ROOT\backend\venv"
    & "$ROOT\backend\venv\Scripts\pip.exe" install -r "$ROOT\backend\requirements.txt"
}

# 2. Start Backend API
Write-Host "[2/3] Starting FastAPI backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
$backendJob = Start-Process -FilePath "$ROOT\backend\venv\Scripts\python.exe" `
    -ArgumentList "-m uvicorn app.main:app --reload --port 8000" `
    -WorkingDirectory "$ROOT\backend" `
    -PassThru

# 3. Start Frontend Vite Server
Write-Host "[3/3] Starting Vite frontend on http://localhost:3000 ..." -ForegroundColor Green
Set-Location "$ROOT\frontend"
npm.cmd run dev
