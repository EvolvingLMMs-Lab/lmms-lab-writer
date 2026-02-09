#!/bin/bash
set -euo pipefail

REPO="${GITHUB_RELEASE_REPO:-EvolvingLMMs-Lab/lmms-lab-writer}"
TAURI_DIR="apps/desktop/src-tauri"
VERSION="$(node -p "require('./$TAURI_DIR/tauri.conf.json').version")"
TAG="${GITHUB_RELEASE_TAG:-v$VERSION}"
TITLE="${GITHUB_RELEASE_TITLE:-LMMs-Lab Writer v$VERSION}"
CREATE_RELEASE=0
PRERELEASE=0
NOTES_FILE=""

usage() {
  cat <<EOF
Usage: ./scripts/upload-to-github-release.sh [options]

Options:
  --create               Create GitHub release if tag does not exist
  --prerelease           Mark created release as prerelease
  --repo <owner/repo>    GitHub repo (default: $REPO)
  --tag <tag>            Git tag (default: $TAG)
  --title <title>        Release title when creating release
  --notes-file <path>    Notes file for release creation
  -h, --help             Show this help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --create)
      CREATE_RELEASE=1
      ;;
    --prerelease)
      PRERELEASE=1
      ;;
    --repo)
      REPO="$2"
      shift
      ;;
    --tag)
      TAG="$2"
      shift
      ;;
    --title)
      TITLE="$2"
      shift
      ;;
    --notes-file)
      NOTES_FILE="$2"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found"
  exit 1
fi

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login"
  exit 1
fi

ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  ARCH_SUFFIX="aarch64"
else
  ARCH_SUFFIX="x64"
fi

DMG_PATH="$TAURI_DIR/target/release/bundle/dmg/LMMs-Lab Writer_${VERSION}_${ARCH_SUFFIX}.dmg"
PKG_PATH="$TAURI_DIR/target/release/bundle/pkg/LMMs-Lab_Writer_${VERSION}_${ARCH_SUFFIX}.pkg"
NPM_TGZ_PATH="dist/releases/npm/lmms-lab-writer-shared-${VERSION}.tgz"

for file in "$DMG_PATH" "$PKG_PATH"; do
  if [ ! -f "$file" ]; then
    echo "Error: artifact not found: $file"
    echo "Run './scripts/build-dmg.sh' and './scripts/build-pkg.sh' first."
    exit 1
  fi
done

ASSETS=("$DMG_PATH" "$PKG_PATH")
if [ -f "$NPM_TGZ_PATH" ]; then
  ASSETS+=("$NPM_TGZ_PATH")
fi

if ! gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  if [ "$CREATE_RELEASE" -ne 1 ]; then
    echo "Error: release '$TAG' not found in $REPO."
    echo "Re-run with --create to create it first."
    exit 1
  fi

  CREATE_CMD=(gh release create "$TAG" --repo "$REPO" --title "$TITLE")
  if [ "$PRERELEASE" -eq 1 ]; then
    CREATE_CMD+=(--prerelease)
  fi
  if [ -n "$NOTES_FILE" ]; then
    if [ ! -f "$NOTES_FILE" ]; then
      echo "Error: notes file not found: $NOTES_FILE"
      exit 1
    fi
    CREATE_CMD+=(--notes-file "$NOTES_FILE")
  else
    CREATE_CMD+=(--generate-notes)
  fi

  echo "Creating GitHub release $TAG in $REPO..."
  "${CREATE_CMD[@]}"
fi

echo "Uploading assets to GitHub release $TAG..."
gh release upload "$TAG" "${ASSETS[@]}" --repo "$REPO" --clobber

echo "✓ GitHub release upload complete"
echo "Release URL: https://github.com/$REPO/releases/tag/$TAG"

