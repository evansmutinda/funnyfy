# Quick API Test Script for Windows PowerShell
# Tests the Vercel API endpoint directly

$apiUrl = "https://funnyfyapp.vercel.app/api/test"
$body = @{
    payload = @{
        prompt = "A beautiful sunset over mountains"
    }
} | ConvertTo-Json

Write-Host "Testing API endpoint: $apiUrl" -ForegroundColor Cyan
Write-Host "Sending request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $apiUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`n❌ ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nFull Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Yellow
        
        # Try to parse as JSON for better formatting
        try {
            $jsonResponse = $responseBody | ConvertFrom-Json
            Write-Host "`nParsed Error Details:" -ForegroundColor Cyan
            $jsonResponse | ConvertTo-Json -Depth 10
        } catch {
            Write-Host "Could not parse response as JSON" -ForegroundColor Gray
        }
    }
}
