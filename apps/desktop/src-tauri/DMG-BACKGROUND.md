# DMG Background Image

## Overview

The `dmg-background.png` file is used as the background image for the macOS DMG installer. It provides visual guidance for users to drag the app to their Applications folder.

## Specifications

- **Dimensions**: 660x400 pixels
- **Format**: PNG
- **Style**: Neo-brutalism + Pixel Dot Matrix
- **Colors**: Monochrome only (black, white, grays)

## Design Elements

1. **Pixel Dot Matrix Background** - Subtle dot pattern for texture
2. **Neo-Brutalist Frame** - Bold black border with corner brackets
3. **Arrow Guide** - Clear visual indicator showing drag direction
4. **Text Instructions** - "DRAG TO APPLICATIONS" with offset shadow
5. **Brand Element** - "LMMs-Lab Writer" text and barcode accent
6. **Icon Placeholders** - Subtle circles indicating icon positions

## Icon Positions

Configured in `tauri.conf.json`:

- **App Icon**: x=180, y=220
- **Applications Folder**: x=480, y=220

## Regenerating

To regenerate the background image:

```bash
# From project root
python3 scripts/generate-dmg-background.py
```

Or with virtual environment:

```bash
cd /path/to/latex-writer
python3 -m venv .venv
source .venv/bin/activate
pip install Pillow
python3 scripts/generate-dmg-background.py
```

## Configuration

The DMG settings are configured in `tauri.conf.json`:

```json
{
  "bundle": {
    "macOS": {
      "dmg": {
        "background": "dmg-background.png",
        "windowSize": { "width": 660, "height": 400 },
        "appPosition": { "x": 180, "y": 220 },
        "applicationFolderPosition": { "x": 480, "y": 220 }
      }
    }
  }
}
```

## Design System Compliance

Colors follow the monochrome design system:

- `#ffffff` - Background (white)
- `#000000` - Foreground (black)
- `#e5e5e5` - Border (light gray)
- `#666666` - Muted text (medium gray)

No rounded corners, no colors other than grayscale.
