#!/bin/bash
set -euo pipefail

BLOB_TOKEN="vercel_blob_rw_uv96NtHsMy3QxWCo_A5hCZzfbYY2kMZAkeITLHokl1g3PhI"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAURI_DIR="$PROJECT_ROOT/apps/desktop/src-tauri"
VERSION="$(node -p "require('$TAURI_DIR/tauri.conf.json').version")"
ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  ARCH_SUFFIX="aarch64"
else
  ARCH_SUFFIX="x64"
fi
PKG_PATH="$TAURI_DIR/target/release/bundle/pkg/LMMs-Lab_Writer_${VERSION}_${ARCH_SUFFIX}.pkg"
DMG_PATH="$TAURI_DIR/target/release/bundle/dmg/LMMs-Lab Writer_${VERSION}_${ARCH_SUFFIX}.dmg"
APP_PATH="$TAURI_DIR/target/release/bundle/macos/LMMs-Lab Writer.app"
RELEASE_TAG="v${VERSION}"

UPLOAD_GITHUB_RELEASE="${PUBLISH_GITHUB_RELEASE:-0}"
CREATE_GITHUB_RELEASE="${CREATE_GITHUB_RELEASE:-0}"

while [ $# -gt 0 ]; do
  case "$1" in
    --github-release)
      UPLOAD_GITHUB_RELEASE=1
      ;;
    --create-github-release)
      UPLOAD_GITHUB_RELEASE=1
      CREATE_GITHUB_RELEASE=1
      ;;
    -h|--help)
      echo "Usage: ./scripts/release.sh [--github-release] [--create-github-release]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./scripts/release.sh [--github-release] [--create-github-release]"
      exit 1
      ;;
  esac
  shift
done

echo "=========================================="
echo "LMMs-Lab Writer Release Script"
echo "=========================================="
echo ""

cd "$PROJECT_ROOT"

echo "[1/6] Building Tauri app..."
pnpm tauri:build

echo ""
echo "[2/6] Building DMG and PKG installers..."
./scripts/build-dmg.sh
./scripts/build-pkg.sh

echo ""
echo "[3/6] Uploading to Vercel Blob..."
BLOB_READ_WRITE_TOKEN="$BLOB_TOKEN" ./scripts/upload-to-blob.sh

echo ""
echo "[4/6] Uploading to GitHub Release (optional)..."
if [ "$UPLOAD_GITHUB_RELEASE" = "1" ]; then
  GH_ARGS=()
  if [ "$CREATE_GITHUB_RELEASE" = "1" ]; then
    GH_ARGS+=(--create)
  fi
  ./scripts/upload-to-github-release.sh "${GH_ARGS[@]}"
else
  echo "Skipped. Use --github-release (or PUBLISH_GITHUB_RELEASE=1) to enable."
fi

echo ""
echo "[5/6] Updating Homebrew cask..."
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
echo "[6/6] Opening app bundle..."
open "$APP_PATH"

echo ""
echo "=========================================="
echo "✓ Release complete!"
echo "=========================================="
echo ""
echo "Downloads:"
echo "  DMG: https://uv96nthsmy3qxwco.public.blob.vercel-storage.com/LMMs-Lab%20Writer_${VERSION}_${ARCH_SUFFIX}.dmg"
echo "  PKG: https://uv96nthsmy3qxwco.public.blob.vercel-storage.com/LMMs-Lab_Writer_${VERSION}_${ARCH_SUFFIX}.pkg"
echo "  Homebrew: brew install --cask EvolvingLMMs-Lab/tap/lmms-lab-writer"
echo ""
echo "GitHub Release:"
echo "  Tag: ${RELEASE_TAG}"
echo "  URL: https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/releases/tag/${RELEASE_TAG}"
echo "  Upload (existing release): ./scripts/upload-to-github-release.sh"
echo "  Upload (create if missing): ./scripts/upload-to-github-release.sh --create"
echo ""
