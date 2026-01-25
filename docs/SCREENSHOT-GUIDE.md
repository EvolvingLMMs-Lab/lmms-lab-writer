# Screenshot & Recording Guide

Quick guide to capture marketing assets for LMMs-Lab Writer.

## Prerequisites

```bash
# Ensure app is built
cd apps/desktop && pnpm tauri:build

# Open the app
open "src-tauri/target/release/bundle/macos/LMMs-Lab Writer.app"
```

## 1. App Screenshots (5 min)

### Main Editor View

1. Open a LaTeX project folder (e.g., `~/papers/neurips-2025/`)
2. Select `main.tex` in file tree
3. Screenshot: `Cmd + Shift + 4`, then `Space`, click window
4. Save as: `marketing-assets/app-main.png`

### Git Panel

1. Make some changes to a file
2. Open Git panel (click Git icon in sidebar)
3. Screenshot the diff view
4. Save as: `marketing-assets/app-git.png`

### Terminal Panel

1. Open Terminal panel
2. Run `latexmk -pdf main.tex`
3. Screenshot during compilation
4. Save as: `marketing-assets/app-terminal.png`

### Claude/OpenCode Panel

1. Open Claude panel
2. Type a prompt: "Write the Related Work section"
3. Screenshot with cursor blinking
4. Save as: `marketing-assets/app-claude.png`

## 2. Demo Video Recording (10 min)

### Setup

1. Open QuickTime Player
2. File -> New Screen Recording
3. Select app window only (not full screen)
4. Enable microphone if doing voiceover

### Script

```
[0:00] Open LMMs-Lab Writer, show empty state
[0:05] Click "Open Folder", select a paper project
[0:10] Show file tree loading
[0:15] Click main.tex, show LaTeX content
[0:20] Open Claude panel
[0:25] Type: "Write a Related Work section comparing our method to LoRA and QLoRA"
[0:30] Show Claude typing, text appearing in editor real-time
[0:45] Show compile button, PDF preview updating
[0:55] Open Git panel, show diff, commit
[1:00] End
```

### Export

- Format: MP4, H.264
- Resolution: 1920x1080 or 2560x1440
- Save as: `marketing-assets/demo-video.mp4`

## 3. Convert to GIF

```bash
cd marketing-assets

# Full demo GIF (lower quality for size)
ffmpeg -i demo-video.mp4 -vf "fps=12,scale=800:-1:flags=lanczos" -loop 0 demo.gif

# Specific clips
ffmpeg -i demo-video.mp4 -ss 00:00:25 -t 00:00:20 -vf "fps=15,scale=960:-1" claude-typing.gif
ffmpeg -i demo-video.mp4 -ss 00:00:45 -t 00:00:10 -vf "fps=15,scale=960:-1" compile.gif
```

## 4. Update Remotion Video with Real Screenshot

After capturing `app-main.png`:

```bash
# Copy to video public folder
cp marketing-assets/app-main.png apps/video/public/screenshot.png

# Re-render video
cd apps/video
pnpm remotion render src/index.ts MarketingVideo out/marketing-final.mp4
```

Then update `apps/video/src/MarketingVideo.tsx`:

```tsx
// Replace ProductMockup component with:
const ProductMockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 80, stiffness: 120 },
  });

  const scale = interpolate(progress, [0, 1], [0.9, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <Img
      src={staticFile("screenshot.png")}
      style={{
        width: 900,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}
    />
  );
};
```

## 5. Asset Checklist

| Asset               | Size           | Use                   |
| ------------------- | -------------- | --------------------- |
| `app-main.png`      | 1920x1080+     | Product Hunt, README  |
| `app-git.png`       | 1920x1080+     | Feature highlight     |
| `app-terminal.png`  | 1920x1080+     | Feature highlight     |
| `app-claude.png`    | 1920x1080+     | Hero image            |
| `demo-video.mp4`    | 1920x1080, 60s | Product Hunt, YouTube |
| `demo.gif`          | 800px wide     | Twitter, README       |
| `claude-typing.gif` | 960px wide     | Landing page          |

## Quick Commands

```bash
# Create marketing-assets folder
mkdir -p marketing-assets

# Batch resize PNGs for web
for f in marketing-assets/*.png; do
  convert "$f" -resize 1920x1080\> -quality 85 "${f%.png}-web.jpg"
done

# Optimize GIFs
gifsicle -O3 --colors 256 demo.gif -o demo-optimized.gif
```
