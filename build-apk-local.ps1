# FunnyFy — Build APK locally (no EAS quota needed)
# Requires: Android Studio, Android SDK, JDK 17
#
# Usage:
#   .\build-apk-local.ps1              # debug APK (easiest, for testing)
#   .\build-apk-local.ps1 -Release     # release APK (needs signing — see BUILD_APK_LOCAL.md notes)

param(
    [switch]$Release,
    [switch]$SkipPrebuild,
    [switch]$NoVersionBump
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FunnyFy — Local APK Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Join-Path $scriptDir "apps\mobile"

if (-not (Test-Path $mobileDir)) {
    Write-Host "Error: apps/mobile not found. Run from project root." -ForegroundColor Red
    exit 1
}

Set-Location $mobileDir

# Env vars are baked in at build time for EXPO_PUBLIC_*
$envFile = Join-Path $mobileDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Warning: apps/mobile/.env not found." -ForegroundColor Yellow
    Write-Host "Copy env.example to .env and set EXPO_PUBLIC_API_URL + RevenueCat keys." -ForegroundColor Yellow
    Write-Host ""
}

# Check Android SDK
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = "$env:LOCALAPPDATA\Android\Sdk"
}
if (-not (Test-Path $androidHome)) {
    Write-Host "Android SDK not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Android Studio, then set ANDROID_HOME:" -ForegroundColor Yellow
    Write-Host '  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "In Android Studio: SDK Manager -> install Android SDK Platform 35 (or 34)" -ForegroundColor Yellow
    exit 1
}
Write-Host "Android SDK: $androidHome" -ForegroundColor Green

Write-Host ""
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }

if (-not $NoVersionBump) {
    Write-Host ""
    Write-Host "Bumping build numbers (version.json)..." -ForegroundColor Yellow
    node scripts/bump-version.js --build
    if ($LASTEXITCODE -ne 0) { exit 1 }
} else {
    Write-Host "Skipping version bump (-NoVersionBump)" -ForegroundColor Gray
}

$versionInfo = Get-Content (Join-Path $mobileDir "version.json") -Raw | ConvertFrom-Json
Write-Host "App version: $($versionInfo.version) (Android versionCode $($versionInfo.androidVersionCode))" -ForegroundColor Cyan

if (-not $SkipPrebuild) {
    Write-Host ""
    Write-Host "Generating native Android project (expo prebuild)..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes the first time." -ForegroundColor Gray
    npx expo prebuild --platform android --clean
    if ($LASTEXITCODE -ne 0) { exit 1 }
} else {
    Write-Host "Skipping prebuild (-SkipPrebuild)" -ForegroundColor Gray
}

$androidDir = Join-Path $mobileDir "android"
if (-not (Test-Path $androidDir)) {
    Write-Host "Error: android/ folder missing. Run without -SkipPrebuild." -ForegroundColor Red
    exit 1
}

Set-Location $androidDir

$variant = if ($Release) { "Release" } else { "Debug" }
$task = if ($Release) { "assembleRelease" } else { "assembleDebug" }

Write-Host ""
Write-Host "Building $variant APK (gradlew $task)..." -ForegroundColor Green
Write-Host "First build can take 10–20 minutes." -ForegroundColor Gray
Write-Host ""

.\gradlew.bat $task

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Build failed. Common fixes:" -ForegroundColor Red
    Write-Host "  • Install JDK 17 and set JAVA_HOME" -ForegroundColor Gray
    Write-Host "  • Open Android Studio -> SDK Manager -> install SDK Platform + Build-Tools" -ForegroundColor Gray
    Write-Host "  • Release builds need signing — use debug build (no -Release flag) for testing" -ForegroundColor Gray
    exit 1
}

$apkSubdir = if ($Release) { "release" } else { "debug" }
$apkName = if ($Release) { "app-release.apk" } else { "app-debug.apk" }
$apkPath = Join-Path $androidDir "app\build\outputs\apk\$apkSubdir\$apkName"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "APK location:" -ForegroundColor Cyan
Write-Host "  $apkPath" -ForegroundColor White
Write-Host ""
Write-Host "Install on your phone:" -ForegroundColor Yellow
Write-Host "  1. Copy APK to the device (USB, email, Drive, etc.)" -ForegroundColor Gray
Write-Host "  2. Enable Install unknown apps for your file manager" -ForegroundColor Gray
Write-Host "  3. Tap the APK to install" -ForegroundColor Gray
Write-Host ""
