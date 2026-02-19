#!/usr/bin/env bash
set -euo pipefail

npm run release

echo "Release artifacts created in dist/"