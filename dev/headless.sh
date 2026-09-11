#!/bin/bash
# Run a dev page (sim.html / stress.html) in headless Firefox and print its SIMLOG lines.
# usage: dev/headless.sh "dev/stress.html?runs=60&frames=9000&smart=1" [timeout-seconds]
# No Node needed: python3 serves the repo; the page logs via sync XHR to /SIMLOG/<msg>.
cd "$(dirname "$0")/.." || exit 1
T=${TMPDIR:-/tmp}/dabs-headless.$$; mkdir -p "$T"; PORT=${PORT:-8765}
python3 -m http.server "$PORT" >"$T/server.log" 2>&1 & SP=$!
sleep 1; mkdir -p "$T/profile"
timeout "${2:-120}" firefox --headless --profile "$T/profile" --no-remote --screenshot "$T/shot.png" "http://localhost:$PORT/$1" >/dev/null 2>&1
kill $SP 2>/dev/null; wait $SP 2>/dev/null
grep -a "SIMLOG" "$T/server.log" | sed -e 's/.*SIMLOG\///' -e 's/ HTTP.*//' | python3 -c "import sys,urllib.parse; [print(urllib.parse.unquote(l.strip())) for l in sys.stdin]"
rm -rf "$T"
