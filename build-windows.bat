@echo off
setlocal
cd /d "%~dp0"
echo Installation des dependances Electron...
call npm install
if errorlevel 1 exit /b %errorlevel%
echo Verification du code...
call npm run check
if errorlevel 1 exit /b %errorlevel%
echo Generation de l'installeur et de la version portable Windows...
call npm run dist:win
if errorlevel 1 exit /b %errorlevel%
echo.
echo Build termine. Les fichiers sont dans le dossier dist\
pause
