@echo off
title Centinela Script Generator

echo.
echo  ========================================
echo   CENTINELA - Generador de Scripts
echo  ========================================
echo.

echo  Liberando el puerto 3001 si esta ocupado...
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"

echo  Iniciando el servidor...
echo  Una vez iniciado, abre tu navegador en:
echo.
echo    http://localhost:3001
echo.
echo  Para detener el servidor presiona Ctrl+C
echo.

node server.js

pause
