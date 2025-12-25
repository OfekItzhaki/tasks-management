# PowerShell script to organize and commit all uncommitted changes
# Run this from the project root

Write-Host "Organizing all uncommitted changes into logical commits..." -ForegroundColor Cyan

# Commit 1: Add connection troubleshooting guide
Write-Host "`nCommit 1: Add connection troubleshooting guide" -ForegroundColor Yellow
git add QUICK_FIX_CONNECTION.md
git commit -m "docs: Add connection troubleshooting guide

- Add QUICK_FIX_CONNECTION.md with step-by-step fix instructions
- Document CORS and IP address issues
- Include troubleshooting steps for common connection errors"

# Commit 2: Update environment configuration
Write-Host "`nCommit 2: Update environment configuration" -ForegroundColor Yellow
git add mobile-app/.env
git commit -m "chore: Update API URL in .env to current IP address

- Update EXPO_PUBLIC_API_URL from 192.168.68.55 to 192.168.7.97
- Ensure mobile app connects to correct backend address"

# Commit 3: Documentation formatting (trailing newlines)
Write-Host "`nCommit 3: Documentation formatting" -ForegroundColor Yellow
git add CHANGELOG.md
git add COMMIT_INSTRUCTIONS.md
git add COMMIT_PLAN.md
git add VERSIONING_STRATEGY.md
git add mobile-app/HOW_TO_VIEW_LOGS.md
git add mobile-app/IMPROVEMENTS_CHECKLIST.md
git add mobile-app/NETWORK_TROUBLESHOOTING.md
git add mobile-app/PRODUCTION_BUILD.md
git commit -m "chore: Add trailing newlines to documentation files

- Standardize formatting across all markdown documentation files"

# Commit 4: Scripts formatting
Write-Host "`nCommit 4: Scripts formatting" -ForegroundColor Yellow
git add commit-changes.ps1
git add organize-commits.ps1
git add update-version.ps1
git commit -m "chore: Add trailing newlines to PowerShell scripts

- Standardize formatting for commit and versioning scripts"

# Commit 5: Configuration files formatting
Write-Host "`nCommit 5: Configuration files formatting" -ForegroundColor Yellow
git add mobile-app/app.json
git add mobile-app/eas.json
git add todo-backend/src/app.module.ts
git commit -m "chore: Format configuration files

- Format app.json and eas.json for consistency
- Format app.module.ts (line endings only)"

Write-Host "`n✅ All commits created successfully!" -ForegroundColor Green
Write-Host "`nReview commits with: git log --oneline -5" -ForegroundColor Cyan
Write-Host "`nReady to push!" -ForegroundColor Green
