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
Write-Host "  FunnyFy - Local APK Build" -ForegroundColor Cyan
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

# Gradle/React Native need JDK 17; default PATH may point at a newer JDK (e.g. 25).
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
    $jdk17Candidates = @(
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Microsoft\jdk-17*"
    )
    foreach ($pattern in $jdk17Candidates) {
        $match = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($match -and (Test-Path (Join-Path $match.FullName "bin\java.exe"))) {
            $env:JAVA_HOME = $match.FullName
            break
        }
    }
}
if ($env:JAVA_HOME) {
    $env:PATH = (Join-Path $env:JAVA_HOME "bin") + ";" + $env:PATH
    Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
} else {
    Write-Host "Warning: JDK 17 not found. Install JDK 17 and set JAVA_HOME before building." -ForegroundColor Yellow
}

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

# Edge-to-edge MainActivity — nav bar transparency breaks if this line is missing after prebuild.
$mainActivities = Get-ChildItem -Path (Join-Path $androidDir "app\src\main") -Recurse -Filter "MainActivity.kt" -ErrorAction SilentlyContinue
foreach ($ma in $mainActivities) {
    $mc = Get-Content $ma.FullName -Raw
    if ($mc -notmatch 'setDecorFitsSystemWindows') {
        if ($mc -notmatch 'import androidx.core.view.WindowCompat') {
            $mc = $mc -replace 'import android.os.Bundle', "import android.os.Bundle`r`nimport androidx.core.view.WindowCompat"
        }
        $mc = $mc -replace '(fun onCreate\([^{]+\{)\s*\r?\n', "`$1`r`n    WindowCompat.setDecorFitsSystemWindows(window, false)`r`n"
        [System.IO.File]::WriteAllText($ma.FullName, $mc)
        Write-Host "Patched MainActivity edge-to-edge: $($ma.Name)" -ForegroundColor Green
    }
}

# Gradle wrapper defaults to 10s network timeout — too short for gradle-8.x zip on slow networks.
$gradleWrapperProps = Join-Path $androidDir "gradle\wrapper\gradle-wrapper.properties"
if (Test-Path $gradleWrapperProps) {
    $gw = Get-Content $gradleWrapperProps -Raw
    if ($gw -match 'networkTimeout=10000') {
        $gw = $gw -replace 'networkTimeout=10000', 'networkTimeout=600000'
        [System.IO.File]::WriteAllText($gradleWrapperProps, $gw)
        Write-Host "Patched gradle-wrapper.properties: networkTimeout=600000 (10 min)" -ForegroundColor Green
    }
}

# Gradle reads sdk.dir from local.properties (gitignored; expo prebuild does not create it).
$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$sdkDirProp = "sdk.dir=" + ($androidHome.Replace('\', '\\').Replace(':', '\:'))
Set-Content -Path (Join-Path $androidDir "local.properties") -Value $sdkDirProp -Encoding ASCII -NoNewline
Add-Content -Path (Join-Path $androidDir "local.properties") -Value "" -Encoding ASCII

# Debug builds skip JS bundling by default - patch so APK works without Metro/USB.
$buildGradle = Join-Path $androidDir "app\build.gradle"
if (Test-Path $buildGradle) {
    $g = Get-Content $buildGradle -Raw
    if ($g -notmatch 'debuggableVariants\s*=\s*\[\]') {
        $nl = [Environment]::NewLine
        $replacement = '$1    debuggableVariants = []' + $nl
        $g = $g -replace '(react \{\r?\n)', $replacement
        [System.IO.File]::WriteAllText($buildGradle, $g)
        Write-Host "Patched build.gradle: debug APK bundles JS (standalone install)" -ForegroundColor Green
    }
}

Set-Location $androidDir

$variant = if ($Release) { "Release" } else { "Debug" }
$task = if ($Release) { "assembleRelease" } else { "assembleDebug" }

Write-Host ""
Write-Host "Building $variant APK (gradlew $task)..." -ForegroundColor Green
Write-Host "First build can take 10-20 minutes." -ForegroundColor Gray
Write-Host ""

.\gradlew.bat $task

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Build failed. Common fixes:" -ForegroundColor Red
    Write-Host "  - Install JDK 17 and set JAVA_HOME" -ForegroundColor Gray
    Write-Host "  - Open Android Studio -> SDK Manager -> install SDK Platform + Build-Tools" -ForegroundColor Gray
    Write-Host "  - Release builds need signing; use debug build (no -Release flag) for testing" -ForegroundColor Gray
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
