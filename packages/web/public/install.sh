#!/bin/bash
# LMMs-Lab Writer - Installation Script
# Installs the daemon as a background service

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║     LMMs-Lab Writer - Installation         ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js 20+ is required (found v$NODE_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# Check LaTeX
if ! command -v latexmk &> /dev/null; then
    echo -e "${YELLOW}Warning: LaTeX (latexmk) is not installed${NC}"
    echo "  Compilation will not work without LaTeX."
    echo ""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Install with: brew install --cask mactex"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  Install with: sudo apt install texlive-full"
    fi
    echo ""
else
    echo -e "${GREEN}✓${NC} LaTeX (latexmk) installed"
fi

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Warning: git is not installed${NC}"
    echo "  Version control features will not work without git."
else
    echo -e "${GREEN}✓${NC} git installed"
fi

# Install the package globally
echo ""
echo "Installing @lmms-lab/writer-cli..."
npm install -g @lmms-lab/writer-cli@latest

# Get the path to the installed CLI
CLI_PATH=$(which llw)
if [ -z "$CLI_PATH" ]; then
    echo -e "${RED}Error: Failed to find installed CLI${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} CLI installed at $CLI_PATH"

# Create LaunchAgent for macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "Setting up background service (macOS LaunchAgent)..."

    PLIST_PATH="$HOME/Library/LaunchAgents/com.lmms-lab.writer.plist"
    mkdir -p "$HOME/Library/LaunchAgents"

    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.lmms-lab.writer</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$CLI_PATH</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/lmms-lab-writer.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/lmms-lab-writer.err</string>
</dict>
</plist>
EOF

    # Load the LaunchAgent
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    launchctl load "$PLIST_PATH"

    echo -e "${GREEN}✓${NC} Background service installed and started"
fi

# Create systemd service for Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    echo "Setting up background service (systemd user service)..."

    SERVICE_PATH="$HOME/.config/systemd/user/lmms-lab-writer.service"
    mkdir -p "$HOME/.config/systemd/user"

    cat > "$SERVICE_PATH" << EOF
[Unit]
Description=LMMs-Lab Writer Daemon
After=network.target

[Service]
Type=simple
ExecStart=$(which node) $CLI_PATH serve
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF

    # Enable and start the service
    systemctl --user daemon-reload
    systemctl --user enable lmms-lab-writer.service
    systemctl --user start lmms-lab-writer.service

    echo -e "${GREEN}✓${NC} Background service installed and started"
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║          Installation Complete!            ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "The daemon is now running in the background."
echo ""
echo "Next steps:"
echo "  1. Open https://latex-writer.vercel.app"
echo "  2. Click 'Open Folder' to select your LaTeX project"
echo "  3. Start writing!"
echo ""
