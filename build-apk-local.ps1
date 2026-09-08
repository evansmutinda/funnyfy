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

# Native tools (npm, expo, gradle) write warnings to stderr. In Windows
# PowerShell, $ErrorActionPreference=Stop can turn that into a crash with
# no useful message and close the window before you can read it.
$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FunnyFy - Local APK Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Join-Path $scriptDir "apps\mobile"
$logFile = Join-Path $scriptDir "apk-build.log"

function Write-Log([string]$Message) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $Message"
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

function Fail-Build([string]$Message, [object]$ErrorRecord = $null) {
    Write-Host ""
    Write-Host "BUILD FAILED" -ForegroundColor Red
    Write-Host $Message -ForegroundColor Red
    if ($ErrorRecord) {
        Write-Host ($ErrorRecord | Out-String) -ForegroundColor DarkRed
        Write-Log ($ErrorRecord | Out-String)
    }
    Write-Host ""
    Write-Host "Full log: $logFile" -ForegroundColor Yellow
    Write-Log "FAILED: $Message"
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

Set-Content -Path $logFile -Value "FunnyFy local APK build log`n" -Encoding UTF8
Write-Host "Log file: $logFile" -ForegroundColor Gray
Write-Log "Starting (Release=$Release SkipPrebuild=$SkipPrebuild NoVersionBump=$NoVersionBump)"

if (-not (Test-Path $mobileDir)) {
    Fail-Build "apps/mobile not found. Run from project root."
}

Set-Location $mobileDir

# Env vars are baked in at build time for EXPO_PUBLIC_*
$envFile = Join-Path $mobileDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Warning: apps/mobile/.env not found." -ForegroundColor Yellow
    Write-Host "Copy env.example to .env and set EXPO_PUBLIC_API_URL + RevenueCat keys." -ForegroundColor Yellow
    Write-Host ""
    Write-Log "Warning: .env missing"
}

# Check Android SDK
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = "$env:LOCALAPPDATA\Android\Sdk"
}
if (-not (Test-Path $androidHome)) {
    Fail-Build "Android SDK not found at $androidHome. Install Android Studio, then set ANDROID_HOME."
}
Write-Host "Android SDK: $androidHome" -ForegroundColor Green
Write-Log "Android SDK: $androidHome"

# Gradle/React Native need JDK 17. PATH often points at Java 25, which crashes Gradle.
function Find-Jdk17Home {
    $exact = @(
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Eclipse Adoptium\jdk-17",
        "C:\Program Files\Microsoft\jdk-17"
    )
    foreach ($root in $exact) {
        if (Test-Path (Join-Path $root "bin\java.exe")) { return $root }
    }
    $globs = @(
        "C:\Program Files\Java\jdk-17*",
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Microsoft\jdk-17*"
    )
    foreach ($pattern in $globs) {
        $match = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($match -and (Test-Path (Join-Path $match.FullName "bin\java.exe"))) {
            return $match.FullName
        }
    }
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
        $out = cmd /c "`"$env:JAVA_HOME\bin\java.exe`" -version 2>&1"
        if ("$out" -match 'version "17') { return $env:JAVA_HOME }
    }
    return $null
}

$jdk17Home = Find-Jdk17Home
if (-not $jdk17Home) {
    Fail-Build "JDK 17 not found. Install JDK 17 (not 21/25). PATH currently has a newer Java that crashes Gradle."
}
$env:JAVA_HOME = $jdk17Home
$env:PATH = (Join-Path $env:JAVA_HOME "bin") + ";" + $env:PATH
Write-Host "JAVA_HOME: $env:JAVA_HOME (forced JDK 17)" -ForegroundColor Green
Write-Log "JAVA_HOME: $env:JAVA_HOME"

try {

Write-Host ""
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
Write-Log "npm install"
npm install
if ($LASTEXITCODE -ne 0) { Fail-Build "npm install failed (exit $LASTEXITCODE)." }

if (-not $NoVersionBump) {
    Write-Host ""
    Write-Host "Bumping build numbers (version.json)..." -ForegroundColor Yellow
    Write-Log "bump-version --build"
    node scripts/bump-version.js --build
    if ($LASTEXITCODE -ne 0) { Fail-Build "Version bump failed (exit $LASTEXITCODE)." }
} else {
    Write-Host "Skipping version bump (-NoVersionBump)" -ForegroundColor Gray
}

$versionInfo = Get-Content (Join-Path $mobileDir "version.json") -Raw | ConvertFrom-Json
Write-Host "App version: $($versionInfo.version) (Android versionCode $($versionInfo.androidVersionCode))" -ForegroundColor Cyan
Write-Log "App version $($versionInfo.version) code $($versionInfo.androidVersionCode)"

if (-not $SkipPrebuild) {
    Write-Host ""
    Write-Host "Generating native Android project (expo prebuild)..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes the first time." -ForegroundColor Gray
    Write-Log "expo prebuild --platform android --clean"
    npx expo prebuild --platform android --clean
    if ($LASTEXITCODE -ne 0) { Fail-Build "expo prebuild failed (exit $LASTEXITCODE)." }
} else {
    Write-Host "Skipping prebuild (-SkipPrebuild)" -ForegroundColor Gray
}

$androidDir = Join-Path $mobileDir "android"
if (-not (Test-Path $androidDir)) {
    Fail-Build "android/ folder missing. Run without -SkipPrebuild."
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

# Expo writes androidStatusBar.backgroundColor "transparent" as a literal
# <color> which aapt2 cannot compile. Hex #00000000 is valid.
$colorsXml = Join-Path $androidDir "app\src\main\res\values\colors.xml"
if (Test-Path $colorsXml) {
    $colors = Get-Content $colorsXml -Raw
    $patchedColors = $colors -replace '>(transparent)<' , '>#00000000<'
    if ($patchedColors -ne $colors) {
        [System.IO.File]::WriteAllText($colorsXml, $patchedColors)
        Write-Host "Patched colors.xml: transparent -> #00000000" -ForegroundColor Green
        Write-Log "Patched colors.xml transparent color"
    }
}

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
Write-Log "gradlew $task"

cmd /c "gradlew.bat $task"
if ($LASTEXITCODE -ne 0) {
    Fail-Build "Gradle $task failed (exit $LASTEXITCODE). See log above and $logFile"
}

$apkSubdir = if ($Release) { "release" } else { "debug" }
$apkName = if ($Release) { "app-release.apk" } else { "app-debug.apk" }
$apkPath = Join-Path $androidDir "app\build\outputs\apk\$apkSubdir\$apkName"
if (-not (Test-Path $apkPath)) {
    Fail-Build "Gradle reported success but APK was not found at $apkPath"
}
Write-Log "APK: $apkPath"

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
Write-Host "Log: $logFile" -ForegroundColor Gray

} catch {
    Fail-Build $_.Exception.Message $_
}
