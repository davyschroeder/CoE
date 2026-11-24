@echo off
cd /d "%~dp0"
if not exist dist\index.html (
  echo No dist folder yet: run npm install and npm run build first.
  pause
  exit /b 1
)
echo Chronicles of Aether - open http://127.0.0.1:8000/ in your browser.
start "" "http://127.0.0.1:8000/"
py -3 -m http.server 8000 --bind 127.0.0.1 --directory dist
pause
