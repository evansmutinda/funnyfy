# Test script for RevenueCat subscription flow
# Tests: Webhook → Database → Subscription API

param(
    [string]$UserId = "test-user-123",
    [string]$Tier = "starter",
    [string]$ApiUrl = "https://funnyfy-staging.vercel.app"
)

Write-Host "🧪 Testing RevenueCat Subscription Flow" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test webhook endpoint (simulate purchase)
Write-Host "1️⃣ Testing webhook endpoint (simulating purchase)..." -ForegroundColor Yellow
$webhookBody = @{
    userId = $UserId
    tier = $Tier
    platform = "test"
} | ConvertTo-Json

try {
    $webhookResponse = Invoke-RestMethod -Uri "$ApiUrl/api/test-revenuecat-webhook" `
        -Method POST `
        -ContentType "application/json" `
        -Body $webhookBody
    
    if ($webhookResponse.ok) {
        Write-Host "✅ Webhook test successful!" -ForegroundColor Green
        Write-Host "   Subscription created: $($webhookResponse.subscription.tier)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Webhook test failed: $($webhookResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Webhook test failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Wait a moment for database to update
Write-Host "2️⃣ Waiting for database to update..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Step 3: Test subscription API
Write-Host "3️⃣ Testing subscription API..." -ForegroundColor Yellow
try {
    $subscriptionResponse = Invoke-RestMethod -Uri "$ApiUrl/api/user/subscription?userId=$UserId" `
        -Method GET `
        -Headers @{ "x-user-id" = $UserId }
    
    if ($subscriptionResponse.ok) {
        Write-Host "✅ Subscription API working!" -ForegroundColor Green
        
        if ($subscriptionResponse.subscription) {
            $sub = $subscriptionResponse.subscription
            $usage = $subscriptionResponse.usage
            
            Write-Host "   Tier: $($sub.tier)" -ForegroundColor Gray
            Write-Host "   Status: $($sub.status)" -ForegroundColor Gray
            Write-Host "   Usage: $($usage.current)/$($usage.limit)" -ForegroundColor Gray
            Write-Host "   Is Trial: $($subscriptionResponse.isTrial)" -ForegroundColor Gray
            
            if ($sub.tier -eq $Tier -and $sub.status -eq "active") {
                Write-Host ""
                Write-Host "🎉 SUCCESS! Subscription flow is working correctly!" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "⚠️  WARNING: Subscription tier/status mismatch" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️  No subscription found (user might be in trial)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Subscription API failed: $($subscriptionResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Subscription API failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Cyan

