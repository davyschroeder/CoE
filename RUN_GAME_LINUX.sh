#!/usr/bin/env bash
# Serve the built game (run `npm run build` first) and open http://127.0.0.1:8000/
set -e
cd "$(dirname "$0")"
if [ ! -f dist/index.html ]; then echo "No dist/ folder yet: run npm install and npm run build first."; exit 1; fi
printf '\nChronicles of Aether\nOpen http://127.0.0.1:8000/ in your browser. Press Ctrl+C here to stop.\n\n'
exec python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
