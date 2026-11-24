#!/usr/bin/env bash
# Serve the built game and open http://127.0.0.1:8000/ (dist/ after `npm run build`, or build/ in a release zip).
set -e
cd "$(dirname "$0")"
if [ -f dist/index.html ]; then DIR=dist; elif [ -f build/index.html ]; then DIR=build; else echo "No built game found: run npm install and npm run build first."; exit 1; fi
printf '\nChronicles of Aether\nOpen http://127.0.0.1:8000/ in your browser. Press Ctrl+C here to stop.\n\n'
exec python3 -m http.server 8000 --bind 127.0.0.1 --directory "$DIR"
