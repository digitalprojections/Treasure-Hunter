#!/usr/bin/env bash
set -euo pipefail

TARGET="/home/ubuntu/migration/public_html/treasuremaps"
ARCHIVE="/tmp/treasuremaps-dist.tgz"
BACKUP="/home/ubuntu/migration/public_html/treasuremaps.backup.$(date +%Y%m%d%H%M%S)"

mkdir -p "$(dirname "$TARGET")"

if [ -d "$TARGET" ]; then
  cp -a "$TARGET" "$BACKUP"
fi

rm -rf "$TARGET"
mkdir -p "$TARGET"
tar -xzf "$ARCHIVE" -C "$TARGET"
find "$TARGET" -type d -exec chmod 755 {} \;
find "$TARGET" -type f -exec chmod 644 {} \;

echo "deployed=$TARGET"
echo "backup=$BACKUP"
