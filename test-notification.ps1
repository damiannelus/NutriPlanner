# Test Notification Script
# Usage: .\test-notification.ps1 <userId>

param(
    [Parameter(Mandatory=$true)]
    [string]$userId
)

$functionUrl = "https://us-central1-meal-planner-305e6.cloudfunctions.net/sendTestNotification"

$body = @{
    userId = $userId
} | ConvertTo-Json

Write-Host "Sending test notification to user: $userId" -ForegroundColor Cyan
Write-Host "Function URL: $functionUrl" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $functionUrl -Method Post -Body $body -ContentType "application/json"
    Write-Host "`nSuccess! ✓" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "`nError! ✗" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nNote: Make sure you have:" -ForegroundColor Yellow
Write-Host "  1. Deployed Cloud Functions" -ForegroundColor Yellow
Write-Host "  2. Registered FCM token for this user" -ForegroundColor Yellow
Write-Host "  3. Granted notification permission in browser" -ForegroundColor Yellow
