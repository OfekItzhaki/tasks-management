# Versioning Strategy

## Recommended: Semantic Versioning

Use **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., API changes)
- **MINOR**: New features, backward compatible (e.g., new reminder types)
- **PATCH**: Bug fixes, backward compatible (e.g., reminder saving fixes)

## Current Versions

- **Mobile App**: `1.0.0` (in `mobile-app/app.json` and `package.json`)
- **Backend**: `0.0.1` (in `todo-backend/package.json`)

## Recommended Version Bump

Based on recent changes, suggest bumping to:

### Mobile App: `1.1.0`
**Reason**: New features added (not just bug fixes)
- Step editing feature
- Reminder time persistence
- Alarm toggle functionality
- Improved empty states
- Better error messages

### Backend: `0.1.0` 
**Reason**: CORS configuration added (minor feature)

## Git Tags

Create tags for releases:

```bash
# Create annotated tag for mobile app v1.1.0
git tag -a v1.1.0 -m "Release v1.1.0: Step editing, reminder improvements, and UX enhancements"

# Create annotated tag for backend v0.1.0
git tag -a backend-v0.1.0 -m "Release v0.1.0: Added CORS support for mobile app"
```

## Tagging Strategy

### Option 1: Combined Tags (Recommended)
Tag both frontend and backend together when they're released together:
```bash
git tag -a v1.1.0 -m "Release v1.1.0: Complete feature set with step editing and reminder improvements"
```

### Option 2: Separate Tags
Tag frontend and backend separately:
```bash
# Frontend tag
git tag -a mobile-v1.1.0 -m "Mobile app v1.1.0: Step editing and reminder improvements"

# Backend tag  
git tag -a backend-v0.1.0 -m "Backend v0.1.0: CORS configuration"
```

## Version Update Checklist

When releasing a new version:

1. **Update version numbers:**
   - `mobile-app/app.json` → `version: "1.1.0"`
   - `mobile-app/package.json` → `version: "1.1.0"`
   - `mobile-app/app.json` → Android `versionCode` (increment by 1)
   - `todo-backend/package.json` → `version: "0.1.0"`

2. **Create CHANGELOG.md** (optional but recommended):
   ```markdown
   ## [1.1.0] - 2025-12-16

   ### Added
   - Step editing functionality
   - Reminder time persistence
   - Alarm toggle for reminders
   - Enhanced empty states
   - Comprehensive documentation

   ### Fixed
   - Multiple reminders not saving correctly
   - Reminder times not persisting after edit
   - Weekly reminders not saving with daily reminders
   - Network connection issues
   ```

3. **Create git tag:**
   ```bash
   git tag -a v1.1.0 -m "Release v1.1.0"
   ```

4. **Push tag:**
   ```bash
   git push origin v1.1.0
   ```

## Recommended Next Steps

1. Organize current changes into logical commits
2. Update version to 1.1.0 in mobile app
3. Update version to 0.1.0 in backend  
4. Create release tag v1.1.0
5. Push commits and tag to remote

