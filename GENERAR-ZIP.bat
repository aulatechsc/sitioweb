@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Generando el ZIP del sitio...
echo.
node "herramientas/armar-zip.js"
echo.
echo  Listo: SITIO-COMPLETO.zip quedo en el Escritorio.
echo.
pause
