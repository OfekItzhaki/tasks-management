# PowerShell script to update version numbers and create release tag
# Run this from the project root

param(
    [string]$Version = "1.1.0",
    [string]$BackendVersion = "0.1.0",
    [switch]$CreateTag
)

Write-Host "Updating versions..." -ForegroundColor Cyan

# Update mobile app version in app.json
$appJsonPath = "mobile-app/app.json"
$appJson = Get-Content $appJsonPath | ConvertFrom-Json
$appJson.expo.version = $Version
$appJson.expo.android.versionCode = [int]$appJson.expo.android.versionCode + 1
$appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath
Write-Host "✅ Updated mobile-app/app.json: version=$Version, versionCode=$($appJson.expo.android.versionCode)" -ForegroundColor Green

# Update mobile app version in package.json
$mobilePackageJsonPath = "mobile-app/package.json"
$mobilePackageJson = Get-Content $mobilePackageJsonPath | ConvertFrom-Json
$mobilePackageJson.version = $Version
$mobilePackageJson | ConvertTo-Json -Depth 10 | Set-Content $mobilePackageJsonPath
Write-Host "✅ Updated mobile-app/package.json: version=$Version" -ForegroundColor Green

# Update backend version in package.json
$backendPackageJsonPath = "todo-backend/package.json"
$backendPackageJson = Get-Content $backendPackageJsonPath | ConvertFrom-Json
$backendPackageJson.version = $BackendVersion
$backendPackageJson | ConvertTo-Json -Depth 10 | Set-Content $backendPackageJsonPath
Write-Host "✅ Updated todo-backend/package.json: version=$BackendVersion" -ForegroundColor Green

if ($CreateTag) {
    Write-Host "`nCreating git tag v$Version..." -ForegroundColor Yellow
    $tagMessage = "Release v${Version}: Step editing, reminder improvements, and UX enhancements"
    git tag -a "v${Version}" -m "$tagMessage"
    Write-Host "✅ Created tag v$Version" -ForegroundColor Green
    Write-Host "`nPush tag with: git push origin v${Version}" -ForegroundColor Cyan
}

Write-Host "`n✅ Version update complete!" -ForegroundColor Green


