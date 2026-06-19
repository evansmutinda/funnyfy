# FunnyFy - Version Bump (delegates to scripts/bump-version.js)
# Interactive semver bump + build numbers

$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FunnyFy - Version Bump" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$current = Get-Content version.json -Raw | ConvertFrom-Json
Write-Host "Current: $($current.version) (Android $($current.androidVersionCode), iOS $($current.iosBuildNumber))" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Build only (+1 versionCode / buildNumber)" -ForegroundColor White
Write-Host "2. Patch ($($current.version) -> next patch)" -ForegroundColor White
Write-Host "3. Minor" -ForegroundColor White
Write-Host "4. Major" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" { node scripts/bump-version.js --build }
    "2" { node scripts/bump-version.js --patch }
    "3" { node scripts/bump-version.js --minor }
    "4" { node scripts/bump-version.js --major }
    default {
        Write-Host "Invalid choice." -ForegroundColor Red
        exit 1
    }
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host ""
Write-Host "Done. Commit version.json (and synced files) before building." -ForegroundColor Green
