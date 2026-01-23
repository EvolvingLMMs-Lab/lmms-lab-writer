# LMMs-Lab Writer - Installation Script for Windows
# Installs the daemon as a background service using Task Scheduler

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     LMMs-Lab Writer - Installation         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = (node -v) -replace 'v', '' -split '\.' | Select-Object -First 1
    if ([int]$nodeVersion -lt 20) {
        Write-Host "Error: Node.js 20+ is required (found v$nodeVersion)" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Node.js $(node -v)" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js 20+ from https://nodejs.org"
    exit 1
}

# Check LaTeX
$latexmk = Get-Command latexmk -ErrorAction SilentlyContinue
if (-not $latexmk) {
    Write-Host "Warning: LaTeX (latexmk) is not installed" -ForegroundColor Yellow
    Write-Host "  Compilation will not work without LaTeX."
    Write-Host "  Install MiKTeX from https://miktex.org or TeX Live from https://tug.org/texlive"
    Write-Host ""
} else {
    Write-Host "✓ LaTeX (latexmk) installed" -ForegroundColor Green
}

# Check git
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "Warning: git is not installed" -ForegroundColor Yellow
    Write-Host "  Version control features will not work without git."
} else {
    Write-Host "✓ git installed" -ForegroundColor Green
}

# Install the package globally
Write-Host ""
Write-Host "Installing @lmms-lab/writer-cli..."
npm install -g @lmms-lab/writer-cli

# Get the path to the installed CLI
$cliPath = (Get-Command llw -ErrorAction SilentlyContinue).Source
if (-not $cliPath) {
    Write-Host "Error: Failed to find installed CLI" -ForegroundColor Red
    exit 1
}
Write-Host "✓ CLI installed at $cliPath" -ForegroundColor Green

# Create scheduled task for Windows
Write-Host ""
Write-Host "Setting up background service (Windows Task Scheduler)..."

$taskName = "LMMs-Lab-Writer"
$nodePath = (Get-Command node).Source

# Remove existing task if present
schtasks /Delete /TN $taskName /F 2>$null

# Create the task
$action = New-ScheduledTaskAction -Execute $nodePath -Argument "$cliPath serve"
$trigger = New-ScheduledTaskTrigger -AtLogon
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

# Start the task immediately
Start-ScheduledTask -TaskName $taskName

Write-Host "✓ Background service installed and started" -ForegroundColor Green

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Installation Complete!            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "The daemon is now running in the background."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open https://latex-writer.vercel.app"
Write-Host "  2. Click 'Open Folder' to select your LaTeX project"
Write-Host "  3. Start writing!"
Write-Host ""
