# Test script for subscription cancellation and renewal
# Tests the webhook handlers for CANCELLATION and RENEWAL events

param(
    [string]$UserId = "test-user-123",
    [string]$ApiUrl = "https://funnyfy-staging.vercel.app",
    [string]$Action = "both"  # "cancel", "renew", or "both"
)

Write-Host "🧪 Testing Subscription Cancellation & Renewal" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current subscription status
Write-Host "0️⃣ Checking current subscription status..." -ForegroundColor Yellow
try {
    $currentSub = Invoke-RestMethod -Uri "$ApiUrl/api/user/subscription?userId=$UserId" `
        -Method GET `
        -Headers @{ "x-user-id" = $UserId }
    
    if ($currentSub.ok) {
        if ($currentSub.subscription) {
            Write-Host "✅ Current subscription:" -ForegroundColor Green
            Write-Host "   Tier: $($currentSub.subscription.tier)" -ForegroundColor Gray
            Write-Host "   Status: $($currentSub.subscription.status)" -ForegroundColor Gray
            Write-Host "   Period End: $($currentSub.subscription.periodEnd)" -ForegroundColor Gray
            Write-Host "   Cancel At Period End: $($currentSub.subscription.cancelAtPeriodEnd)" -ForegroundColor Gray
            Write-Host "   Usage: $($currentSub.usage.current)/$($currentSub.usage.limit)" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  No active subscription found" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Failed to get current subscription: $_" -ForegroundColor Red
}
Write-Host ""

if ($Action -eq "cancel" -or $Action -eq "both") {
    # Step 2: Test cancellation
    Write-Host "1️⃣ Testing cancellation (simulating CANCELLATION webhook)..." -ForegroundColor Yellow
    $cancelBody = @{
        userId = $UserId
    } | ConvertTo-Json

    try {
        $cancelResponse = Invoke-RestMethod -Uri "$ApiUrl/api/test-cancel-subscription" `
            -Method POST `
            -ContentType "application/json" `
            -Body $cancelBody
        
        if ($cancelResponse.ok) {
            Write-Host "✅ Cancellation test successful!" -ForegroundColor Green
            Write-Host "   Subscription marked for cancellation at period end" -ForegroundColor Gray
        } else {
            Write-Host "❌ Cancellation test failed: $($cancelResponse.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Cancellation test failed: $_" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "   Waiting 2 seconds, then checking subscription status..." -ForegroundColor Gray
    Start-Sleep -Seconds 2

    try {
        $afterCancel = Invoke-RestMethod -Uri "$ApiUrl/api/user/subscription?userId=$UserId" `
            -Method GET `
            -Headers @{ "x-user-id" = $UserId }
        
        if ($afterCancel.ok -and $afterCancel.subscription) {
            Write-Host "   ✅ After cancellation:" -ForegroundColor Green
            Write-Host "      Status: $($afterCancel.subscription.status) (still active)" -ForegroundColor Gray
            Write-Host "      Cancel At Period End: $($afterCancel.subscription.cancelAtPeriodEnd)" -ForegroundColor Gray
            if ($afterCancel.subscription.cancelAtPeriodEnd) {
                Write-Host "      ✅ User keeps access until period end!" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   ⚠️  Failed to verify cancellation: $_" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($Action -eq "renew" -or $Action -eq "both") {
    # Step 3: Test renewal
    Write-Host "2️⃣ Testing renewal (simulating RENEWAL webhook)..." -ForegroundColor Yellow
    $renewBody = @{
        userId = $UserId
    } | ConvertTo-Json

    try {
        $renewResponse = Invoke-RestMethod -Uri "$ApiUrl/api/test-renew-subscription" `
            -Method POST `
            -ContentType "application/json" `
            -Body $renewBody
        
        if ($renewResponse.ok) {
            Write-Host "✅ Renewal test successful!" -ForegroundColor Green
            Write-Host "   New period end: $($renewResponse.subscription.newPeriodEnd)" -ForegroundColor Gray
            Write-Host "   Usage reset: $($renewResponse.usage.count)" -ForegroundColor Gray
        } else {
            Write-Host "❌ Renewal test failed: $($renewResponse.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Renewal test failed: $_" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "   Waiting 2 seconds, then checking subscription status..." -ForegroundColor Gray
    Start-Sleep -Seconds 2

    try {
        $afterRenew = Invoke-RestMethod -Uri "$ApiUrl/api/user/subscription?userId=$UserId" `
            -Method GET `
            -Headers @{ "x-user-id" = $UserId }
        
        if ($afterRenew.ok -and $afterRenew.subscription) {
            Write-Host "   ✅ After renewal:" -ForegroundColor Green
            Write-Host "      Status: $($afterRenew.subscription.status)" -ForegroundColor Gray
            Write-Host "      Period End: $($afterRenew.subscription.periodEnd)" -ForegroundColor Gray
            Write-Host "      Cancel At Period End: $($afterRenew.subscription.cancelAtPeriodEnd)" -ForegroundColor Gray
            Write-Host "      Usage: $($afterRenew.usage.current)/$($afterRenew.usage.limit) (should be reset)" -ForegroundColor Gray
            if ($afterRenew.usage.current -eq 0) {
                Write-Host "      ✅ Usage quota reset successfully!" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   ⚠️  Failed to verify renewal: $_" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "✅ Test complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Gray
Write-Host "  .\test-cancel-renew.ps1 -Action cancel  # Test cancellation only" -ForegroundColor DarkGray
Write-Host "  .\test-cancel-renew.ps1 -Action renew   # Test renewal only" -ForegroundColor DarkGray
Write-Host "  .\test-cancel-renew.ps1 -Action both   # Test both (default)" -ForegroundColor DarkGray

