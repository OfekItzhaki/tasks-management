# Fix Windows Firewall for Mobile App Connection
# Run this script as Administrator

Write-Host "Adding Windows Firewall rule for port 3000..." -ForegroundColor Yellow

try {
    # Check if rule already exists
    $existingRule = Get-NetFirewallRule -DisplayName "Node.js Server Port 3000" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "Firewall rule already exists. Removing old rule..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "Node.js Server Port 3000"
    }
    
    # Add new firewall rule
    New-NetFirewallRule -DisplayName "Node.js Server Port 3000" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3000 `
        -Action Allow `
        -Profile Any
    
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure your mobile device is on the same Wi-Fi network"
    Write-Host "2. Verify your IP address: ipconfig | findstr IPv4"
    Write-Host "3. Update mobile-app/.env with your IP if it changed"
    Write-Host "4. Restart the mobile app"
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "This script requires Administrator privileges." -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
}
