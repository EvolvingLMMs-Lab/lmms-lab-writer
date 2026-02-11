#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [ValidateSet("all", "x64", "x86", "arm64")]
    [string[]]$Arch = @("all"),

    [ValidateSet("all", "nsis", "msi")]
    [string[]]$Bundles = @("all"),

    [switch]$SkipRustTargetInstall,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Assert-CommandExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    if (-not (Get-Command -Name $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(Mandatory = $false)]
        [string[]]$Arguments = @()
    )

    $display = "$FilePath $($Arguments -join ' ')".Trim()
    if ($DryRun) {
        Write-Host "[dry-run] $display"
        return
    }

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $display"
    }
}

$archToTarget = @{
    x64   = "x86_64-pc-windows-msvc"
    x86   = "i686-pc-windows-msvc"
    arm64 = "aarch64-pc-windows-msvc"
}

$selectedArch = if ($Arch -contains "all") {
    @("x64", "x86", "arm64")
}
else {
    $Arch
}
$selectedArch = $selectedArch | Select-Object -Unique

$selectedBundles = if ($Bundles -contains "all") {
    @("nsis", "msi")
}
else {
    $Bundles
}
$selectedBundles = $selectedBundles | Select-Object -Unique
$bundleArg = $selectedBundles -join ","

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$tauriDir = Join-Path $projectRoot "apps/desktop/src-tauri"

Write-Host "=========================================="
Write-Host "Building Windows bundles for LMMs-Lab Writer"
Write-Host "=========================================="
Write-Host ""
Write-Host "Architectures: $($selectedArch -join ', ')"
Write-Host "Bundles: $($selectedBundles -join ', ')"
Write-Host "Project root: $projectRoot"
Write-Host ""

Assert-CommandExists -Name "pnpm"

if (-not $SkipRustTargetInstall) {
    Assert-CommandExists -Name "rustup"
    if ($DryRun) {
        foreach ($archName in $selectedArch) {
            $target = $archToTarget[$archName]
            Invoke-External -FilePath "rustup" -Arguments @("target", "add", $target)
        }
    }
    else {
        $installedTargets = @(& rustup target list --installed)
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to list installed Rust targets."
        }

        foreach ($archName in $selectedArch) {
            $target = $archToTarget[$archName]
            if ($installedTargets -contains $target) {
                Write-Host "[OK] Rust target already installed: $target"
                continue
            }

            Write-Host "[INFO] Installing missing Rust target: $target"
            Invoke-External -FilePath "rustup" -Arguments @("target", "add", $target)
        }
    }
}
else {
    Write-Host "[INFO] Skipping Rust target installation checks."
}

foreach ($archName in $selectedArch) {
    $target = $archToTarget[$archName]

    Write-Host ""
    Write-Host "[BUILD] $archName ($target)"
    Invoke-External -FilePath "pnpm" -Arguments @(
        "--filter",
        "@lmms-lab/writer-desktop",
        "tauri",
        "build",
        "--target",
        $target,
        "--bundles",
        $bundleArg
    )
}

if ($DryRun) {
    Write-Host ""
    Write-Host "[OK] Dry run complete."
    exit 0
}

$artifacts = @()
foreach ($archName in $selectedArch) {
    $target = $archToTarget[$archName]
    $bundleRoot = Join-Path $tauriDir "target/$target/release/bundle"
    if (-not (Test-Path -LiteralPath $bundleRoot)) {
        continue
    }

    if ($selectedBundles -contains "nsis") {
        $nsisDir = Join-Path $bundleRoot "nsis"
        if (Test-Path -LiteralPath $nsisDir) {
            $artifacts += Get-ChildItem -LiteralPath $nsisDir -File -Filter "*.exe" | ForEach-Object {
                [PSCustomObject]@{
                    Arch   = $archName
                    Target = $target
                    Bundle = "nsis"
                    Name   = $_.Name
                    SizeMB = [math]::Round($_.Length / 1MB, 2)
                    Path   = $_.FullName
                }
            }
        }
    }

    if ($selectedBundles -contains "msi") {
        $msiDir = Join-Path $bundleRoot "msi"
        if (Test-Path -LiteralPath $msiDir) {
            $artifacts += Get-ChildItem -LiteralPath $msiDir -File -Filter "*.msi" | ForEach-Object {
                [PSCustomObject]@{
                    Arch   = $archName
                    Target = $target
                    Bundle = "msi"
                    Name   = $_.Name
                    SizeMB = [math]::Round($_.Length / 1MB, 2)
                    Path   = $_.FullName
                }
            }
        }
    }
}

$artifacts = $artifacts | Sort-Object -Property Path -Unique

Write-Host ""
if ($artifacts.Count -eq 0) {
    Write-Host "[WARN] Build completed, but no Windows bundle artifacts were found."
    exit 1
}

Write-Host "=========================================="
Write-Host "[OK] Windows build complete"
Write-Host "=========================================="
Write-Host ""
$artifacts |
    Sort-Object -Property Arch, Bundle, Name |
    Format-Table -AutoSize Arch, Bundle, SizeMB, Name, Path
Write-Host ""
