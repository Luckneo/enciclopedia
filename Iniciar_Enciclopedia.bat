@echo off
title Enciclopedia Planetaria Universal
echo Iniciando Enciclopedia Planetaria Universal...
python main.py
if %errorlevel% neq 0 (
    echo.
    echo Ocurrio un error al ejecutar la aplicacion.
    pause
)

