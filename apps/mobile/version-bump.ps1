# FunnyFy - Version Bump Script (PowerShell)
# This script increments the app version and build numbers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FunnyFy - Version Bump Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Read current app.config.js
$configPath = "app.config.js"
if (-not (Test-Path $configPath)) {
    Write-Host "Error: app.config.js not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Read the config file
$configContent = Get-Content $configPath -Raw

# Extract current version
if ($configContent -match "version:\s*['""]([^'""]+)['""]") {
    $currentVersion = $matches[1]
    Write-Host "Current version: $currentVersion" -ForegroundColor Yellow
} else {
    Write-Host "Error: Could not find version in app.config.js" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Extract current versionCode
$currentVersionCode = 1
if ($configContent -match "versionCode:\s*(\d+)") {
    $currentVersionCode = [int]$matches[1]
    Write-Host "Current Android versionCode: $currentVersionCode" -ForegroundColor Yellow
}

# Extract current buildNumber
$currentBuildNumber = 1
if ($configContent -match "buildNumber:\s*['""]?(\d+)['""]?") {
    $currentBuildNumber = [int]$matches[1]
    Write-Host "Current iOS buildNumber: $currentBuildNumber" -ForegroundColor Yellow
}

Write-Host ""

# Parse version parts
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Ask user what type of increment
Write-Host "What type of version increment?" -ForegroundColor Cyan
Write-Host "1. Patch (1.0.0 -> 1.0.1) - Bug fixes" -ForegroundColor White
Write-Host "2. Minor (1.0.0 -> 1.1.0) - New features" -ForegroundColor White
Write-Host "3. Major (1.0.0 -> 2.0.0) - Breaking changes" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1-3)"

$newMajor = $major
$newMinor = $minor
$newPatch = $patch

switch ($choice) {
    "1" {
        $newPatch = $patch + 1
        Write-Host "Incrementing PATCH version..." -ForegroundColor Green
    }
    "2" {
        $newMinor = $minor + 1
        $newPatch = 0
        Write-Host "Incrementing MINOR version..." -ForegroundColor Green
    }
    "3" {
        $newMajor = $major + 1
        $newMinor = 0
        $newPatch = 0
        Write-Host "Incrementing MAJOR version..." -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

$newVersion = "$newMajor.$newMinor.$newPatch"
$newVersionCode = $currentVersionCode + 1
$newBuildNumber = $currentBuildNumber + 1

Write-Host ""
Write-Host "New version: $newVersion" -ForegroundColor Cyan
Write-Host "New Android versionCode: $newVersionCode" -ForegroundColor Cyan
Write-Host "New iOS buildNumber: $newBuildNumber" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Confirm update? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Update cancelled." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 0
}

# Update version
$configContent = $configContent -replace "version:\s*['""][^'""]+['""]", "version: '$newVersion'"

# Update versionCode
if ($configContent -match "versionCode:\s*\d+") {
    $configContent = $configContent -replace "versionCode:\s*\d+", "versionCode: $newVersionCode"
} else {
    # Add versionCode if it doesn't exist
    $configContent = $configContent -replace "(android:\s*\{[^}]*package:\s*['""][^'""]+['""],)", "`$1`n      versionCode: $newVersionCode,"
}

# Update buildNumber
if ($configContent -match "buildNumber:\s*['""]?\d+['""]?") {
    $configContent = $configContent -replace "buildNumber:\s*['""]?\d+['""]?", "buildNumber: '$newBuildNumber'"
} else {
    # Add buildNumber if it doesn't exist
    $configContent = $configContent -replace "(ios:\s*\{[^}]*supportsTablet:\s*[^,]+,)", "`$1`n      buildNumber: '$newBuildNumber',"
}

# Write updated config
Set-Content -Path $configPath -Value $configContent -NoNewline

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Version updated successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Version: $currentVersion -> $newVersion" -ForegroundColor Cyan
Write-Host "Android versionCode: $currentVersionCode -> $newVersionCode" -ForegroundColor Cyan
Write-Host "iOS buildNumber: $currentBuildNumber -> $newBuildNumber" -ForegroundColor Cyan
Write-Host ""
Write-Host "Don't forget to commit these changes!" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"


