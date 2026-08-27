# Generate the FunnyFy Android release keystore (run once, back up the .jks file offline).
#
# Usage (from apps/mobile):
#   .\scripts\generate-release-keystore.ps1
#
# Creates:
#   android/app/funnyfy-release.jks   (after you run expo prebuild)
#   keystore.properties             (gitignored — passwords live here for local Gradle)

param(
  [string]$Alias = 'funnyfy',
  [string]$StorePassword,
  [string]$KeyPassword
)

$ErrorActionPreference = 'Stop'
$mobileDir = Split-Path -Parent $PSScriptRoot
Set-Location $mobileDir

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  Write-Host 'keytool not found. Install JDK 17 and ensure JAVA_HOME/bin is on PATH.' -ForegroundColor Red
  exit 1
}

if (-not $StorePassword) {
  $secure = Read-Host 'Enter keystore password (min 6 chars)' -AsSecureString
  $StorePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}
if (-not $KeyPassword) {
  $KeyPassword = $StorePassword
}

$jksDir = Join-Path $mobileDir 'android\app'
if (-not (Test-Path $jksDir)) {
  Write-Host 'android/app not found — run: npx expo prebuild --platform android' -ForegroundColor Yellow
  $jksDir = Join-Path $mobileDir 'credentials'
  New-Item -ItemType Directory -Force -Path $jksDir | Out-Null
}

$jksPath = Join-Path $jksDir 'funnyfy-release.jks'
if (Test-Path $jksPath) {
  Write-Host "Keystore already exists: $jksPath" -ForegroundColor Yellow
  Write-Host 'Delete it first if you really want a new one.' -ForegroundColor Yellow
  exit 1
}

$dname = 'CN=FunnyFy, OU=Mobile, O=FunnyFy, L=Nairobi, ST=NA, C=KE'
& keytool -genkeypair -v `
  -storetype JKS `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -alias $Alias `
  -keystore $jksPath `
  -storepass $StorePassword `
  -keypass $KeyPassword `
  -dname $dname

$relStoreFile = if ($jksPath -like '*\android\app\*') { '../android/app/funnyfy-release.jks' } else { '../credentials/funnyfy-release.jks' }

$propsPath = Join-Path $mobileDir 'keystore.properties'
@(
  "# Generated $(Get-Date -Format o)",
  "storeFile=$relStoreFile",
  "storePassword=$StorePassword",
  "keyAlias=$Alias",
  "keyPassword=$KeyPassword"
) | Set-Content -Path $propsPath -Encoding UTF8

Write-Host ''
Write-Host 'Release keystore created.' -ForegroundColor Green
Write-Host "  JKS:     $jksPath"
Write-Host "  Props:   $propsPath"
Write-Host ''
Write-Host 'IMPORTANT: back up the .jks file and passwords in a password manager.' -ForegroundColor Cyan
Write-Host 'For EAS Play Store builds, also run: eas credentials -p android' -ForegroundColor Cyan
