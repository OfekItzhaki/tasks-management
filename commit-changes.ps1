# PowerShell script to commit uncommitted changes in logical groups
# Run this from the project root

Write-Host "Organizing uncommitted changes into logical commits..." -ForegroundColor Cyan

# Commit 1: Frontend bug fixes and cleanup
Write-Host "`nCommit 1: Frontend bug fixes and cleanup" -ForegroundColor Yellow
git add mobile-app/src/screens/TasksScreen.tsx
git add mobile-app/src/services/auth.service.ts
git add mobile-app/src/utils/storage.ts
git commit -m "fix: Improve code quality and fix bugs

- Add storage cleanup when deleting tasks (reminders, times, alarms)
- Remove redundant normalizeBooleans calls (already handled by api-client)
- Fix UserStorage types (User instead of any)
- Improve type safety in storage utilities"

# Commit 2: Backend changes (revert/keep frontend-focused)
Write-Host "`nCommit 2: Keep frontEnd branch focused on frontend" -ForegroundColor Yellow
git add todo-backend/src/main.ts
git add todo-backend/src/tasks/tasks.service.ts
git commit -m "chore: Revert backend changes to keep frontEnd branch frontend-focused

- Remove CORS and dotenv config from main.ts
- Set default reminderDaysBefore to [1] instead of empty array"

# Commit 3: Add versioning and commit organization tools
Write-Host "`nCommit 3: Add versioning and commit organization tools" -ForegroundColor Yellow
git add CHANGELOG.md
git add COMMIT_INSTRUCTIONS.md
git add COMMIT_PLAN.md
git add VERSIONING_STRATEGY.md
git add organize-commits.ps1
git add update-version.ps1
git commit -m "docs: Add versioning strategy and commit organization tools

- Add CHANGELOG.md with change history
- Add commit organization scripts and documentation
- Add versioning strategy guide"

# Commit 4: Documentation formatting (trailing newlines)
Write-Host "`nCommit 4: Documentation formatting" -ForegroundColor Yellow
git add mobile-app/HOW_TO_VIEW_LOGS.md
git add mobile-app/IMPROVEMENTS_CHECKLIST.md
git add mobile-app/NETWORK_TROUBLESHOOTING.md
git add mobile-app/PRODUCTION_BUILD.md
git add mobile-app/eas.json
git commit -m "chore: Add trailing newlines to documentation files"

# Commit 5: app.json formatting (if needed)
Write-Host "`nCommit 5: app.json formatting" -ForegroundColor Yellow
$appJsonDiff = git diff mobile-app/app.json
if ($appJsonDiff) {
    git add mobile-app/app.json
    git commit -m "chore: Format app.json with consistent indentation"
} else {
    Write-Host "  No changes to app.json, skipping..." -ForegroundColor Gray
}

Write-Host "`n✅ All commits created successfully!" -ForegroundColor Green
Write-Host "`nReview commits with: git log --oneline -5" -ForegroundColor Cyan

