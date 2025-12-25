# Commit Organization Instructions

## Quick Start

### Option 1: Use the automated script (Recommended)

Run the PowerShell script to automatically organize commits:

```powershell
.\organize-commits.ps1
```

This will create 3 logical commits:
1. Debugging and troubleshooting documentation
2. Production build documentation  
3. Improvements checklist update

### Option 2: Manual commits

If you prefer manual control, run these commands:

```bash
# Unstage everything first
git reset HEAD

# Commit 1: Debugging docs
git add mobile-app/HOW_TO_VIEW_LOGS.md mobile-app/NETWORK_TROUBLESHOOTING.md
git commit -m "docs: Add debugging and troubleshooting guides

- Add HOW_TO_VIEW_LOGS.md with instructions for viewing console logs
- Add NETWORK_TROUBLESHOOTING.md with network setup and debugging steps
- Help developers troubleshoot common issues during development"

# Commit 2: Production build docs
git add mobile-app/PRODUCTION_BUILD.md mobile-app/eas.json
git commit -m "docs: Update production build documentation

- Update PRODUCTION_BUILD.md with latest build instructions
- Update eas.json configuration for EAS Build
- Include Expo Go notification limitations"

# Commit 3: Checklist update
git add mobile-app/IMPROVEMENTS_CHECKLIST.md
git commit -m "docs: Update improvements checklist with recent implementations

- Mark step editing as completed
- Update reminder system completion status
- Document recent bug fixes and improvements"
```

## Version Update

After organizing commits, update versions and create a release tag:

### Automated (Recommended)

```powershell
# Update versions and create tag
.\update-version.ps1 -Version "1.1.0" -BackendVersion "0.1.0" -CreateTag
```

### Manual

1. Update `mobile-app/app.json`:
   ```json
   "version": "1.1.0",
   "android": {
     "versionCode": 2  // Increment by 1
   }
   ```

2. Update `mobile-app/package.json`:
   ```json
   "version": "1.1.0"
   ```

3. Update `todo-backend/package.json`:
   ```json
   "version": "0.1.0"
   ```

4. Commit version updates:
   ```bash
   git add mobile-app/app.json mobile-app/package.json todo-backend/package.json
   git commit -m "chore: Bump version to 1.1.0 (mobile) and 0.1.0 (backend)"
   ```

5. Create release tag:
   ```bash
   git tag -a v1.1.0 -m "Release v1.1.0: Step editing, reminder improvements, and UX enhancements"
   ```

6. Push everything:
   ```bash
   git push origin frontEnd
   git push origin v1.1.0
   ```

## Commit Message Format

Following [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks (version bumps, etc.)

## Example Workflow

```bash
# 1. Organize documentation commits
.\organize-commits.ps1

# 2. Review commits
git log --oneline -3

# 3. Update versions and create tag
.\update-version.ps1 -Version "1.1.0" -BackendVersion "0.1.0" -CreateTag

# 4. Commit version changes
git add mobile-app/app.json mobile-app/package.json todo-backend/package.json
git commit -m "chore: Bump version to 1.1.0 (mobile) and 0.1.0 (backend)"

# 5. Push commits and tag
git push origin frontEnd
git push origin v1.1.0
```


