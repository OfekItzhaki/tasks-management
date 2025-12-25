# Commit Organization Plan

## Current Staged Changes

The following files are staged and ready to commit:
- `mobile-app/HOW_TO_VIEW_LOGS.md`
- `mobile-app/IMPROVEMENTS_CHECKLIST.md`
- `mobile-app/NETWORK_TROUBLESHOOTING.md`
- `mobile-app/PRODUCTION_BUILD.md`
- `mobile-app/eas.json`

## Recommended Commit Strategy

### Commit 1: Add documentation for debugging and troubleshooting
**Files:**
- `mobile-app/HOW_TO_VIEW_LOGS.md`
- `mobile-app/NETWORK_TROUBLESHOOTING.md`

**Commit message:**
```
docs: Add debugging and troubleshooting guides

- Add HOW_TO_VIEW_LOGS.md with instructions for viewing console logs
- Add NETWORK_TROUBLESHOOTING.md with network setup and debugging steps
- Help developers troubleshoot common issues during development
```

### Commit 2: Update production build documentation
**Files:**
- `mobile-app/PRODUCTION_BUILD.md`
- `mobile-app/eas.json`

**Commit message:**
```
docs: Update production build documentation

- Update PRODUCTION_BUILD.md with latest build instructions
- Update eas.json configuration for EAS Build
- Include Expo Go notification limitations
```

### Commit 3: Update improvements checklist
**Files:**
- `mobile-app/IMPROVEMENTS_CHECKLIST.md`

**Commit message:**
```
docs: Update improvements checklist with recent implementations

- Mark step editing as completed
- Update reminder system completion status
- Document recent bug fixes and improvements
```

## Alternative: Single Documentation Commit

If you prefer a single commit for all documentation:

**Commit message:**
```
docs: Add comprehensive documentation for development and deployment

- Add HOW_TO_VIEW_LOGS.md with console log viewing instructions
- Add NETWORK_TROUBLESHOOTING.md with network setup guide
- Update PRODUCTION_BUILD.md with latest build instructions
- Update IMPROVEMENTS_CHECKLIST.md with recent changes
- Update eas.json configuration
```


