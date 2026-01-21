# Pre-Submission Checklist

## ✅ Completed

- [x] Privacy policy created and hosted at: `https://tasksmanagement-lv54.onrender.com/privacy-policy.html`
- [x] App description added to `app.json`
- [x] Keywords and store listing info created (see `STORE_LISTING.md`)
- [x] Production profile configured in `eas.json` with API URL
- [x] All documentation files created

## 🔴 Critical - Must Do Before Submission

### 1. Fix App Icon Issue
**Problem:** App icon doesn't appear when installed

**Solution:**
- Verify `assets/icon.png` is exactly **1024x1024 pixels**
- Verify `assets/adaptive-icon.png` is exactly **1024x1024 pixels**
- See `APP_ICON_REQUIREMENTS.md` for details
- After fixing, rebuild: `eas build --platform android --profile production`

**How to check icon size:**
```bash
# Windows PowerShell
Get-Item mobile-app/assets/icon.png | Select-Object Name, Length
# Or check in image editor - dimensions should be 1024x1024
```

### 2. Prepare Screenshots
**Required for both stores:**

**Android (Google Play):**
- Minimum 2 screenshots, recommended 4-8
- Phone: 1080 x 1920px or higher
- Tablet (optional): 1600 x 2560px
- Feature graphic: 1024 x 500px

**iOS (App Store):**
- iPhone 6.7": 1290 x 2796 pixels
- iPhone 6.5": 1242 x 2688 pixels  
- iPhone 5.5": 1242 x 2208 pixels
- iPad 12.9" (if supporting iPad): 2048 x 2732 pixels

**Screenshot ideas:**
- Login/Register screen
- Lists screen showing different list types
- Tasks screen with tasks
- Task detail with steps/sub-tasks
- Reminders screen
- Profile screen

### 3. Update Email in Privacy Policy (When Ready)
- Currently using temp email
- Update `todo-backend/public/privacy-policy.html` line 140
- Redeploy backend
- Update URL in store listings if needed

## 🟡 Recommended Before Submission

### 4. Test Production Build Locally (When Available)
Since you're waiting for EAS builds to reset:
- Test the preview build thoroughly
- Check all features work
- Test on different Android versions if possible

### 5. Prepare Store Assets
- **App Icon**: High-quality 512x512px for Play Store, 1024x1024px for App Store
- **Feature Graphic** (Google Play): 1024x500px promotional image
- **App Preview Videos** (Optional but recommended for App Store)

### 6. Review App Store Requirements
- [Google Play Console Requirements](https://support.google.com/googleplay/android-developer/answer/9866151)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## 📋 Submission Day Checklist

When your EAS builds reset (in ~10 days):

### Step 1: Fix Icons (if not done)
```bash
# Verify icon sizes, then rebuild
eas build --platform android --profile production
```

### Step 2: Build Production App
```bash
cd mobile-app
eas build --platform android --profile production
```

### Step 3: Submit to Store
```bash
# After build completes
eas submit --platform android --profile production
```

### Step 4: Complete Store Listings
- Upload screenshots
- Add feature graphic (Google Play)
- Write short description (80 chars)
- Fill out content rating questionnaire
- Set pricing (Free/Paid)
- Set target countries

### Step 5: Submit for Review
- Google Play: Review typically 1-3 days
- App Store: Review typically 1-2 days

## 🎯 Priority Order

**Before Next Build (High Priority):**
1. ✅ Fix app icon dimensions
2. ✅ Take/store screenshots
3. ✅ Test current preview build thoroughly

**On Submission Day:**
4. Build production app
5. Submit to store
6. Complete store listing forms
7. Submit for review

## 📝 Notes

- Privacy policy URL: `https://tasksmanagement-lv54.onrender.com/privacy-policy.html`
- App package: `com.tasksmanagement.app`
- Current version: `1.2.1`
- Version code: `3` (Android)

## Resources

- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
