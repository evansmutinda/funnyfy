Param(
    [string]$Branch = "Staging",
    [string]$Message = "sync backend changes"
)

Write-Host "Syncing changes to branch '$Branch' with message '$Message'..." -ForegroundColor Cyan

# Ensure we run from the script directory (repo root)
Set-Location -Path $PSScriptRoot

# Show current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch"

if ($currentBranch -ne $Branch) {
    Write-Host "Checking out branch $Branch..."
    git checkout $Branch
}

# Add typical backend / throttle-related files
Write-Host "Staging backend files..."
git add `
    api/*.ts `
    api/migrations.sql `
    package.json `
    package-lock.json

# Show status before committing
git status

# If nothing to commit, exit gracefully
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit 0
}

Write-Host "Committing..."
git commit -m $Message

Write-Host "Pushing to origin/$Branch..."
git push origin $Branch

Write-Host "Done." -ForegroundColor Green

