@echo off
title Specials Builder - Stopping...
echo.
echo ========================================
echo   STOPPING ALL SERVERS...
echo ========================================
echo.

echo Closing Node.js processes (Backend)...
taskkill /F /IM node.exe /T >nul 2>&1

echo Closing npm processes (Frontend)...
taskkill /F /FI "WINDOWTITLE eq Frontend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Backend*" >nul 2>&1

echo.
echo ========================================
echo   ALL SERVERS STOPPED!
echo ========================================
echo.
pause
