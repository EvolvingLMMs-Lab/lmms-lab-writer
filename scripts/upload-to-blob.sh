#!/bin/bash
set -e

PKG_PATH="apps/desktop/src-tauri/target/release/bundle/pkg/LMMs-Lab_Writer_0.1.0_aarch64.pkg"

if [ -z "$BLOB_READ_WRITE_TOKEN" ]; then
    echo "Error: BLOB_READ_WRITE_TOKEN not set"
    echo ""
    echo "Get your token from Vercel Dashboard:"
    echo "  Project -> Storage -> Blob -> Manage -> Tokens"
    echo ""
    echo "Then run:"
    echo "  BLOB_READ_WRITE_TOKEN=your_token ./scripts/upload-to-blob.sh"
    exit 1
fi

if [ ! -f "$PKG_PATH" ]; then
    echo "Error: PKG not found at $PKG_PATH"
    echo "Run './scripts/build-pkg.sh' first"
    exit 1
fi

FILENAME=$(basename "$PKG_PATH")
echo "Uploading $FILENAME to Vercel Blob..."

curl -X PUT "https://blob.vercel-storage.com/$FILENAME" \
    -H "Authorization: Bearer $BLOB_READ_WRITE_TOKEN" \
    -H "x-content-type: application/octet-stream" \
    -H "x-add-random-suffix: false" \
    --data-binary "@$PKG_PATH" \
    --progress-bar | cat

echo ""
echo "✓ Upload complete"
echo "URL: https://uv96nthsmy3qxwco.public.blob.vercel-storage.com/$FILENAME"
