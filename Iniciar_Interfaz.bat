@echo off
title Enciclopedia Planetaria - Interfaz Web Local
if not exist "%~dp0interfaz\enciclopedia-completa\.env.local" (
  start "Enciclopedia API" /min python local_api.py
)
cd /d "%~dp0interfaz\enciclopedia-completa"
if not exist ".next\BUILD_ID" (
  echo Preparando la interfaz por primera vez...
  call npm run build
  if errorlevel 1 (
    echo No se pudo compilar la interfaz.
    pause
    exit /b 1
  )
)
call npm run start -- -H 127.0.0.1 -p 5173
