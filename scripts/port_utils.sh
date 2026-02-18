#!/usr/bin/env bash
set -euo pipefail

# Usage: ./port_utils.sh check 5001
#        ./port_utils.sh kill 5001
CMD=${1:-check}
PORT=${2:-5001}

if [ "$CMD" = "check" ]; then
  ss -ltnp | grep -E ":${PORT}\b" || echo "No process listening on ${PORT}"
  exit 0
fi

if [ "$CMD" = "kill" ]; then
  PID=$(ss -ltnp | awk -v p=":${PORT}" '$4 ~ p {print $6}' | sed -n 's/pid=\([0-9]*\),.*$/\1/p' | head -n1 || true)
  if [ -z "$PID" ]; then
    echo "No process found on port ${PORT}"
    exit 0
  fi
  echo "Killing PID $PID on port ${PORT}"
  kill "$PID" || sudo kill -9 "$PID"
fi
