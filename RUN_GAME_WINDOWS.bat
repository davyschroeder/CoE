@echo off
cd /d "%~dp0"
set DIR=
if exist dist\index.html set DIR=dist
if not defined DIR if exist build\index.html set DIR=build
if not defined DIR (
  echo No built game found: run npm install and npm run build first.
  pause
  exit /b 1
)
echo Chronicles of Aether - open http://127.0.0.1:8000/ in your browser.
start "" "http://127.0.0.1:8000/"
where py >nul 2>nul
if %errorlevel% equ 0 (py -3 -m http.server 8000 --bind 127.0.0.1 --directory %DIR%) else (python -m http.server 8000 --bind 127.0.0.1 --directory %DIR%)
pause
