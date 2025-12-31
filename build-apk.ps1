# FunnyFy - APK Build Script
# Builds an Android APK using EAS Build

param(
    [ValidateSet("development", "preview", "production")]
    [string]$Profile = "preview"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FunnyFy - APK Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory and navigate to mobile app
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Join-Path $scriptDir "apps\mobile"

if (-not (Test-Path $mobileDir)) {
    Write-Host "Error: apps/mobile directory not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location $mobileDir
Write-Host "Changed to: $mobileDir" -ForegroundColor Gray
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
$easCheck = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easCheck) {
    Write-Host "EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install EAS CLI. Please install manually:" -ForegroundColor Red
        Write-Host "  npm install -g eas-cli" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "EAS CLI installed successfully." -ForegroundColor Green
} else {
    Write-Host "EAS CLI found." -ForegroundColor Green
}

Write-Host ""

# Check if logged in to EAS
Write-Host "Checking EAS login status..." -ForegroundColor Yellow
$whoamiOutput = eas whoami 2>&1

if ($LASTEXITCODE -ne 0 -or $whoamiOutput -match "Not logged in") {
    Write-Host "Not logged in to EAS. Logging in..." -ForegroundColor Yellow
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login failed or cancelled. Exiting..." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Logged in as: $whoamiOutput" -ForegroundColor Green
}

Write-Host ""

# Display build profile info
Write-Host "========================================" -ForegroundColor Cyan
if ($Profile -eq "preview") {
    Write-Host "  Building Preview APK (for testing)" -ForegroundColor Cyan
    Write-Host "  Profile: preview" -ForegroundColor Gray
    Write-Host "  Note: Works with test RevenueCat keys" -ForegroundColor Gray
} elseif ($Profile -eq "development") {
    Write-Host "  Building Development APK" -ForegroundColor Cyan
    Write-Host "  Profile: development" -ForegroundColor Gray
    Write-Host "  Note: Requires dev client, works with test keys" -ForegroundColor Gray
} else {
    Write-Host "  Building Production APK" -ForegroundColor Cyan
    Write-Host "  Profile: production" -ForegroundColor Gray
    Write-Host "  Warning: Requires production RevenueCat keys!" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  • Build APK in the cloud (takes ~10-15 minutes)" -ForegroundColor Gray
Write-Host "  • Provide download link when complete" -ForegroundColor Gray
Write-Host ""
$confirm = Read-Host "Press Enter to start build, or Ctrl+C to cancel"

Write-Host ""
Write-Host "Starting build..." -ForegroundColor Green
Write-Host ""

# Build the APK
eas build --profile $Profile --platform android

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Build Completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your APK is ready for download." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Click the download link above, or" -ForegroundColor Gray
    Write-Host "  2. Visit: https://expo.dev/accounts/[your-account]/projects/funnyfy/builds" -ForegroundColor Gray
    Write-Host "  3. Transfer APK to your Android device" -ForegroundColor Gray
    Write-Host "  4. Enable 'Install from Unknown Sources' on your device" -ForegroundColor Gray
    Write-Host "  5. Install the APK" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Build Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  • Network connection problems" -ForegroundColor Gray
    Write-Host "  • EAS account or billing issues" -ForegroundColor Gray
    Write-Host "  • Missing dependencies or configuration" -ForegroundColor Gray
    Write-Host ""
}

Read-Host "Press Enter to exit"

