#!/bin/bash
set -euo pipefail

if [ -z "${BLOB_READ_WRITE_TOKEN:-}" ]; then
  echo "Error: BLOB_READ_WRITE_TOKEN not set"
  echo ""
  echo "Get your token from Vercel Dashboard:"
  echo "  Project -> Storage -> Blob -> Manage -> Tokens"
  echo ""
  echo "Then run:"
  echo "  BLOB_READ_WRITE_TOKEN=your_token ./scripts/upload-to-blob.sh"
  exit 1
fi

TAURI_DIR="apps/desktop/src-tauri"
VERSION="$(node -p "require('./$TAURI_DIR/tauri.conf.json').version")"
ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  ARCH_SUFFIX="aarch64"
else
  ARCH_SUFFIX="x64"
fi

PKG_PATH="$TAURI_DIR/target/release/bundle/pkg/LMMs-Lab_Writer_${VERSION}_${ARCH_SUFFIX}.pkg"
DMG_PATH="$TAURI_DIR/target/release/bundle/dmg/LMMs-Lab Writer_${VERSION}_${ARCH_SUFFIX}.dmg"

for FILE in "$DMG_PATH" "$PKG_PATH"; do
  if [ ! -f "$FILE" ]; then
    echo "Error: File not found: $FILE"
    echo "Run './scripts/build-dmg.sh' and './scripts/build-pkg.sh' first"
    exit 1
  fi
done

upload_file() {
  local file_path="$1"
  local file_name
  file_name="$(basename "$file_path")"
  local encoded_name="${file_name// /%20}"

  echo "Uploading $file_name to Vercel Blob..."

  curl -sS -X PUT "https://blob.vercel-storage.com/$encoded_name" \
    -H "Authorization: Bearer $BLOB_READ_WRITE_TOKEN" \
    -H "x-content-type: application/octet-stream" \
    -H "x-add-random-suffix: false" \
    --data-binary "@$file_path" \
    >/tmp/lmms-upload-"$file_name".json

  echo "✓ Upload complete"
  echo "URL: https://uv96nthsmy3qxwco.public.blob.vercel-storage.com/$encoded_name"
}

upload_file "$DMG_PATH"
echo ""
upload_file "$PKG_PATH"
