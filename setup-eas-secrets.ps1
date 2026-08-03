# Setup EAS Secrets for APK Build
# This script helps you set RevenueCat keys and API URL as EAS secrets

param(
    [string]$AndroidKey = "",
    [string]$IosKey = "",
    [string]$ApiUrl = "https://funnyfyapp.vercel.app"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EAS Secrets Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$mobileDir = Join-Path $PSScriptRoot "apps\mobile"

if (-not (Test-Path $mobileDir)) {
    Write-Host "Error: apps/mobile directory not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location $mobileDir

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
}

Write-Host ""

# Check if logged in
Write-Host "Checking EAS login..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Please login:" -ForegroundColor Yellow
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login failed. Exiting..." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""

# Get Android Key
if ([string]::IsNullOrWhiteSpace($AndroidKey)) {
    Write-Host "Enter your RevenueCat Android SDK Key:" -ForegroundColor Yellow
    Write-Host "(If you only see test_xxxxx, use that same key for both Android and iOS)" -ForegroundColor Gray
    Write-Host "(Get it from: https://app.revenuecat.com/ -> Settings -> API Keys)" -ForegroundColor Gray
    $AndroidKey = Read-Host "Android Key"
}

if (-not [string]::IsNullOrWhiteSpace($AndroidKey)) {
    Write-Host ""
    Write-Host "Setting EXPO_PUBLIC_REVENUECAT_ANDROID_KEY..." -ForegroundColor Green
    eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value $AndroidKey --type string --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Android key set successfully" -ForegroundColor Green
    } else {
        Write-Host "[FAILED] Failed to set Android key" -ForegroundColor Red
    }
} else {
    Write-Host "Skipping Android key (empty)" -ForegroundColor Yellow
}

Write-Host ""

# Get iOS Key
if ([string]::IsNullOrWhiteSpace($IosKey)) {
    Write-Host "Enter your RevenueCat iOS SDK Key:" -ForegroundColor Yellow
    Write-Host "(If you only see test_xxxxx, use the SAME key you used for Android)" -ForegroundColor Gray
    Write-Host "(Get it from: https://app.revenuecat.com/ -> Settings -> API Keys)" -ForegroundColor Gray
    $IosKey = Read-Host "iOS Key"
}

if (-not [string]::IsNullOrWhiteSpace($IosKey)) {
    Write-Host ""
    Write-Host "Setting EXPO_PUBLIC_REVENUECAT_IOS_KEY..." -ForegroundColor Green
    eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value $IosKey --type string --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] iOS key set successfully" -ForegroundColor Green
    } else {
        Write-Host "[FAILED] Failed to set iOS key" -ForegroundColor Red
    }
} else {
    Write-Host "Skipping iOS key (empty)" -ForegroundColor Yellow
}

Write-Host ""

# Set API URL
Write-Host "Setting EXPO_PUBLIC_API_URL to: $ApiUrl" -ForegroundColor Green
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value $ApiUrl --type string --force
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] API URL set successfully" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Failed to set API URL" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify secrets: eas secret:list" -ForegroundColor Gray
Write-Host "  2. Rebuild APK: .\build-apk.ps1" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
