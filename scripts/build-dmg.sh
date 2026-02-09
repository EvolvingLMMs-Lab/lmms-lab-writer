#!/bin/bash
# Build DMG installer for LMMs-Lab Writer from the built .app bundle.
# The app is ad-hoc signed to avoid broken-signature errors.

set -euo pipefail

APP_NAME="LMMs-Lab Writer"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TAURI_DIR="$PROJECT_ROOT/apps/desktop/src-tauri"
BUNDLE_DIR="$TAURI_DIR/target/release/bundle"
APP_PATH="$BUNDLE_DIR/macos/$APP_NAME.app"
OUTPUT_DIR="$BUNDLE_DIR/dmg"
VERSION=$(node -p "JSON.parse(require('fs').readFileSync('$TAURI_DIR/tauri.conf.json','utf8')).version")

ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  ARCH_SUFFIX="aarch64"
else
  ARCH_SUFFIX="x64"
fi

DMG_NAME="${APP_NAME}_${VERSION}_${ARCH_SUFFIX}.dmg"
DMG_PATH="$OUTPUT_DIR/$DMG_NAME"

echo "=========================================="
echo "Building DMG installer for $APP_NAME"
echo "=========================================="
echo ""

if [ ! -d "$APP_PATH" ]; then
  echo "Error: App bundle not found at $APP_PATH"
  echo "Run 'pnpm tauri:build' first"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Signing app bundle (ad-hoc)..."
codesign --force --deep --sign - "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$APP_PATH" >/dev/null
echo "[OK] App signature verified"

STAGE_DIR="$(mktemp -d /tmp/lmms-lab-dmg.XXXXXX)"
MOUNT_DIR=""
cleanup() {
  if [ -n "$MOUNT_DIR" ] && [ -d "$MOUNT_DIR" ]; then
    hdiutil detach "$MOUNT_DIR" -quiet 2>/dev/null || true
    rm -rf "$MOUNT_DIR"
  fi
  rm -rf "$STAGE_DIR"
}
trap cleanup EXIT

cp -R "$APP_PATH" "$STAGE_DIR/"
ln -s /Applications "$STAGE_DIR/Applications"

echo "Creating DMG..."
rm -f "$DMG_PATH"
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$STAGE_DIR" \
  -ov \
  -format UDZO \
  "$DMG_PATH" >/dev/null

echo "Verifying DMG content..."
MOUNT_DIR="$(mktemp -d /tmp/lmms-lab-mount.XXXXXX)"
hdiutil attach "$DMG_PATH" -mountpoint "$MOUNT_DIR" -nobrowse -quiet
APP_IN_DMG="$(find "$MOUNT_DIR" -maxdepth 1 -name "*.app" -print -quit)"
if [ -z "$APP_IN_DMG" ]; then
  echo "Error: No app bundle found inside DMG"
  exit 1
fi
codesign --verify --deep --strict --verbose=2 "$APP_IN_DMG" >/dev/null
hdiutil detach "$MOUNT_DIR" -quiet
rm -rf "$MOUNT_DIR"
MOUNT_DIR=""
echo "[OK] DMG content signature verified"

echo ""
echo "=========================================="
echo "[OK] DMG build complete!"
echo "=========================================="
echo ""
echo "DMG installer: $DMG_PATH"
echo "Size: $(du -h "$DMG_PATH" | cut -f1)"
echo ""
echo "Note: This build is ad-hoc signed (not notarized)."
