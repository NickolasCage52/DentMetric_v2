#!/usr/bin/env bash
set -euo pipefail

echo "core-api health:"
curl -fsS "http://localhost:8000/health" | cat
echo

echo "agent-orchestrator health:"
curl -fsS "http://localhost:8001/health" | cat
echo

