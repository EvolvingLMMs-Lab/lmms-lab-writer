#!/bin/bash
# Build PKG installer for LMMs-Lab Writer
# Creates a PKG with post-install script that removes quarantine attribute

set -euo pipefail

# Configuration
APP_NAME="LMMs-Lab Writer"
BUNDLE_ID="com.lmms-lab.writer"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TAURI_DIR="$PROJECT_ROOT/apps/desktop/src-tauri"
VERSION="$(node -p "require('$TAURI_DIR/tauri.conf.json').version")"
BUNDLE_DIR="$TAURI_DIR/target/release/bundle"
APP_PATH="$BUNDLE_DIR/macos/$APP_NAME.app"
PKG_SCRIPTS="$SCRIPT_DIR/pkg"
OUTPUT_DIR="$BUNDLE_DIR/pkg"

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    ARCH_SUFFIX="aarch64"
else
    ARCH_SUFFIX="x64"
fi

PKG_NAME="${APP_NAME// /_}_${VERSION}_${ARCH_SUFFIX}.pkg"

echo "=========================================="
echo "Building PKG installer for $APP_NAME"
echo "=========================================="
echo ""

# Step 1: Check if app bundle exists
if [ ! -d "$APP_PATH" ]; then
    echo "Error: App bundle not found at $APP_PATH"
    echo "Run 'pnpm tauri:build' first"
    exit 1
fi

echo "✓ Found app bundle: $APP_PATH"

# Step 1.5: Re-sign app ad-hoc to prevent broken signature errors
echo "Signing app bundle (ad-hoc)..."
codesign --force --deep --sign - "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$APP_PATH" >/dev/null
echo "✓ App signature verified"

# Step 2: Create output directory
mkdir -p "$OUTPUT_DIR"

# Step 3: Ensure post-install script is executable
chmod +x "$PKG_SCRIPTS/postinstall"
echo "✓ Post-install script ready"

# Step 4: Create component package
echo ""
echo "Creating component package..."
COMPONENT_PKG="$OUTPUT_DIR/component.pkg"

pkgbuild \
    --root "$BUNDLE_DIR/macos" \
    --component-plist /dev/stdin \
    --identifier "$BUNDLE_ID" \
    --version "$VERSION" \
    --install-location "/Applications" \
    --scripts "$PKG_SCRIPTS" \
    "$COMPONENT_PKG" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
    <dict>
        <key>BundleHasStrictIdentifier</key>
        <true/>
        <key>BundleIsRelocatable</key>
        <false/>
        <key>BundleIsVersionChecked</key>
        <true/>
        <key>BundleOverwriteAction</key>
        <string>upgrade</string>
        <key>RootRelativeBundlePath</key>
        <string>$APP_NAME.app</string>
    </dict>
</array>
</plist>
EOF

echo "✓ Component package created"

# Step 5: Create distribution XML
echo ""
echo "Creating distribution package..."
DIST_XML="$OUTPUT_DIR/distribution.xml"

cat > "$DIST_XML" << EOF
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="2">
    <title>$APP_NAME</title>
    <organization>com.lmms-lab</organization>
    <domains enable_localSystem="true"/>
    <options customize="never" require-scripts="true" rootVolumeOnly="true"/>
    <volume-check>
        <allowed-os-versions>
            <os-version min="10.15"/>
        </allowed-os-versions>
    </volume-check>
    <choices-outline>
        <line choice="default">
            <line choice="$BUNDLE_ID"/>
        </line>
    </choices-outline>
    <choice id="default"/>
    <choice id="$BUNDLE_ID" visible="false">
        <pkg-ref id="$BUNDLE_ID"/>
    </choice>
    <pkg-ref id="$BUNDLE_ID" version="$VERSION" onConclusion="none">component.pkg</pkg-ref>
</installer-gui-script>
EOF

# Step 6: Build final PKG
FINAL_PKG="$OUTPUT_DIR/$PKG_NAME"

productbuild \
    --distribution "$DIST_XML" \
    --package-path "$OUTPUT_DIR" \
    "$FINAL_PKG"

echo "✓ PKG installer created"

# Step 7: Cleanup intermediate files
rm -f "$COMPONENT_PKG"
rm -f "$DIST_XML"

echo ""
echo "=========================================="
echo "✓ Build complete!"
echo "=========================================="
echo ""
echo "PKG installer: $FINAL_PKG"
echo "Size: $(du -h "$FINAL_PKG" | cut -f1)"
echo ""
echo "The installer includes a post-install script that"
echo "automatically removes the quarantine attribute."
