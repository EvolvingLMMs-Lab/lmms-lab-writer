#!/bin/bash
# Build macOS PKG with postinstall script
# This script runs after `tauri build` to create a proper PKG with postinstall

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="$TAURI_DIR/target/release/bundle/macos"
PKG_SCRIPTS_DIR="$SCRIPT_DIR"

APP_NAME="LMMs-Lab Writer"
APP_BUNDLE="$TARGET_DIR/$APP_NAME.app"
PKG_OUTPUT="$TARGET_DIR/$APP_NAME.pkg"

# Check if app bundle exists
if [ ! -d "$APP_BUNDLE" ]; then
    echo "Error: App bundle not found at $APP_BUNDLE"
    echo "Please run 'pnpm tauri:build' first"
    exit 1
fi

# Check if postinstall script exists
if [ ! -f "$PKG_SCRIPTS_DIR/postinstall" ]; then
    echo "Error: postinstall script not found"
    exit 1
fi

echo "Building PKG with postinstall script..."

# Create temporary directory for PKG scripts
TEMP_SCRIPTS=$(mktemp -d)
cp "$PKG_SCRIPTS_DIR/postinstall" "$TEMP_SCRIPTS/"
chmod +x "$TEMP_SCRIPTS/postinstall"

# Build component package with scripts
COMPONENT_PKG=$(mktemp).pkg
pkgbuild \
    --root "$APP_BUNDLE" \
    --install-location "/Applications/$APP_NAME.app" \
    --scripts "$TEMP_SCRIPTS" \
    --identifier "com.lmms-lab.writer" \
    --version "0.1.0" \
    "$COMPONENT_PKG"

# Build final product package
productbuild \
    --package "$COMPONENT_PKG" \
    "$PKG_OUTPUT"

# Cleanup
rm -rf "$TEMP_SCRIPTS"
rm -f "$COMPONENT_PKG"

echo ""
echo "PKG created successfully: $PKG_OUTPUT"
echo ""
echo "The PKG includes a postinstall script that automatically removes"
echo "the quarantine attribute, so users won't see the 'damaged app' error."
