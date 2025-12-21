# PowerShell script to organize staged changes into logical commits
# Run this from the project root

Write-Host "Organizing commits..." -ForegroundColor Cyan

# Unstage everything first
git reset HEAD

# Commit 1: Debugging and troubleshooting documentation
Write-Host "`nCommit 1: Debugging and troubleshooting guides" -ForegroundColor Yellow
git add mobile-app/HOW_TO_VIEW_LOGS.md
git add mobile-app/NETWORK_TROUBLESHOOTING.md
git commit -m "docs: Add debugging and troubleshooting guides

- Add HOW_TO_VIEW_LOGS.md with instructions for viewing console logs
- Add NETWORK_TROUBLESHOOTING.md with network setup and debugging steps
- Help developers troubleshoot common issues during development"

# Commit 2: Production build documentation
Write-Host "`nCommit 2: Production build documentation" -ForegroundColor Yellow
git add mobile-app/PRODUCTION_BUILD.md
git add mobile-app/eas.json
git commit -m "docs: Update production build documentation

- Update PRODUCTION_BUILD.md with latest build instructions
- Update eas.json configuration for EAS Build
- Include Expo Go notification limitations"

# Commit 3: Improvements checklist
Write-Host "`nCommit 3: Improvements checklist update" -ForegroundColor Yellow
git add mobile-app/IMPROVEMENTS_CHECKLIST.md
git commit -m "docs: Update improvements checklist with recent implementations

- Mark step editing as completed
- Update reminder system completion status  
- Document recent bug fixes and improvements"

Write-Host "`n✅ All commits created successfully!" -ForegroundColor Green
Write-Host "`nReview commits with: git log --oneline -3" -ForegroundColor Cyan

