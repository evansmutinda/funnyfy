# FunnyfyApp - APK Build Script (PowerShell)
# This script builds a production APK for Android using EAS Build

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FunnyfyApp - APK Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

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
    Write-Host "Visit: https://expo.dev/accounts/[your-account]/projects/funnyfyapp/builds" -ForegroundColor Cyan
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

