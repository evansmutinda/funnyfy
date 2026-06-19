# FunnyFy - APK Build Script (PowerShell)
# This script builds a production APK for Android using EAS Build

param(
    [switch]$NoVersionBump
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FunnyFy - APK Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check for uncommitted changes
Write-Host "Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1
if ($gitStatus) {
    Write-Host "Warning: You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Build cancelled." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Git working directory is clean." -ForegroundColor Green
}

Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install EAS CLI. Exiting..." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if logged in to EAS
Write-Host ""
Write-Host "Checking EAS login status..." -ForegroundColor Yellow
$whoamiOutput = eas whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to EAS. Please login..." -ForegroundColor Yellow
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login failed. Exiting..." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Logged in as: $whoamiOutput" -ForegroundColor Green
}

if (-not $NoVersionBump) {
    Write-Host ""
    Write-Host "Bumping build numbers (version.json)..." -ForegroundColor Yellow
    node scripts/bump-version.js --build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Version bump failed." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "Skipping version bump (-NoVersionBump)" -ForegroundColor Gray
}

$versionInfo = Get-Content version.json -Raw | ConvertFrom-Json
Write-Host ""
Write-Host "Building version $($versionInfo.version) (Android versionCode $($versionInfo.androidVersionCode))" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Production APK Build..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will build a production APK for Android." -ForegroundColor Yellow
Write-Host "The build will be uploaded to EAS servers." -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Press Enter to continue, or Ctrl+C to cancel"

Write-Host ""
Write-Host "Verifying required assets..." -ForegroundColor Yellow
$requiredAssets = @(
    "assets/icon.jpg",
    "assets/custom2.jpg",
    "assets/neandc.jpeg",
    "assets/neand3d.jpeg",
    "assets/handd.jpeg",
    "assets/superhero.jpeg",
    "assets/villian.jpeg",
    "assets/cyborg.jpeg"
)

$missingAssets = @()
foreach ($asset in $requiredAssets) {
    if (-not (Test-Path $asset)) {
        $missingAssets += $asset
    }
}

if ($missingAssets.Count -gt 0) {
    Write-Host "Warning: Missing assets:" -ForegroundColor Yellow
    foreach ($asset in $missingAssets) {
        Write-Host "  - $asset" -ForegroundColor Yellow
    }
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Build cancelled." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "All required assets found." -ForegroundColor Green
}

Write-Host ""
Write-Host "Building APK..." -ForegroundColor Green
Write-Host ""

# Build the APK
eas build --profile production --platform android

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your APK will be available in the EAS dashboard." -ForegroundColor Cyan
    Write-Host "Visit: https://expo.dev/accounts/[your-account]/projects/funnyfy/builds" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to exit"

