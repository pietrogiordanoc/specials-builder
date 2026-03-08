@echo off
title Specials Builder - Starting...
echo.
echo ========================================
echo   SPECIALS BUILDER - STARTING...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Backend Server...
start "Backend API (Port 3001)" cmd /k "node server.js"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend (Vite)...
start "Frontend Vite (Port 5173)" cmd /k "npm run client"
timeout /t 5 /nobreak >nul

echo [3/3] Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo   ALL SYSTEMS RUNNING!
echo ========================================
echo.
echo Backend API:  http://localhost:3001
echo Frontend:     http://localhost:5173
echo.
echo Close this window to stop the servers.
echo.
pause
