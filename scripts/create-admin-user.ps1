# PowerShell script to create an admin user
# Run this script to get a user ID for admin access

$apiUrl = $env:API_URL
if (-not $apiUrl) {
    # Default to staging - change to production URL when ready
    $apiUrl = "https://funnyfy-staging.vercel.app"
}

Write-Host "Creating admin user..." -ForegroundColor Cyan
Write-Host "API URL: $apiUrl" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/api/admin/create-admin-user" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{}'

    Write-Host ""
    Write-Host "✅ User created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Admin User ID: " -NoNewline
    Write-Host $response.userId -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the User ID above"
    Write-Host "2. Go to Vercel Dashboard → Settings → Environment Variables"
    Write-Host "3. Add ADMIN_USER_IDS with your User ID"
    Write-Host "4. Redeploy your project"
    Write-Host "5. Visit: $apiUrl/admin/login"
    Write-Host ""
    
    # Copy to clipboard
    $response.userId | Set-Clipboard
    Write-Host "✅ User ID copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error creating user:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

