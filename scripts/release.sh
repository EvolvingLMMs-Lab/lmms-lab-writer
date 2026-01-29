#!/bin/bash
set -e

BLOB_TOKEN="vercel_blob_rw_uv96NtHsMy3QxWCo_A5hCZzfbYY2kMZAkeITLHokl1g3PhI"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG_PATH="$PROJECT_ROOT/apps/desktop/src-tauri/target/release/bundle/pkg/LMMs-Lab_Writer_0.1.0_aarch64.pkg"
APP_PATH="$PROJECT_ROOT/apps/desktop/src-tauri/target/release/bundle/macos/LMMs-Lab Writer.app"

echo "=========================================="
echo "LMMs-Lab Writer Release Script"
echo "=========================================="
echo ""

cd "$PROJECT_ROOT"

echo "[1/5] Building Tauri app..."
pnpm tauri:build

echo ""
echo "[2/5] Building PKG installer..."
./scripts/build-pkg.sh

echo ""
echo "[3/5] Uploading to Vercel Blob..."
BLOB_READ_WRITE_TOKEN="$BLOB_TOKEN" ./scripts/upload-to-blob.sh

echo ""
echo "[4/5] Updating Homebrew cask..."
NEW_SHA=$(shasum -a 256 "$PKG_PATH" | awk '{print $1}')
cd /tmp
rm -rf homebrew-tap
git clone https://github.com/EvolvingLMMs-Lab/homebrew-tap.git
cd homebrew-tap
sed -i '' "s/sha256 \".*\"/sha256 \"$NEW_SHA\"/" Casks/lmms-lab-writer.rb
git add -A
git commit -m "chore: update sha256 for $(date +%Y-%m-%d)"
git push
cd "$PROJECT_ROOT"

echo ""
echo "[5/5] Opening app..."
open "$APP_PATH"

echo ""
echo "=========================================="
echo "✓ Release complete!"
echo "=========================================="
echo ""
echo "Downloads:"
echo "  PKG: https://uv96nthsmy3qxwco.public.blob.vercel-storage.com/LMMs-Lab_Writer_0.1.0_aarch64.pkg"
echo "  Homebrew: brew install --cask EvolvingLMMs-Lab/tap/lmms-lab-writer"
echo ""
