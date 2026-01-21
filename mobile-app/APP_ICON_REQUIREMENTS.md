# App Icon Requirements

## Issue
If your app icon doesn't appear when the app is installed, it's likely due to incorrect icon dimensions or format.

## Requirements

### Main App Icon (`assets/icon.png`)
- **Size:** 1024 x 1024 pixels (square)
- **Format:** PNG (no transparency for Android, transparency OK for iOS)
- **Background:** Should fill the entire canvas (or use adaptive icon for Android)

### Android Adaptive Icon (`assets/adaptive-icon.png`)
- **Size:** 1024 x 1024 pixels
- **Format:** PNG with transparency
- **Safe Zone:** Keep important content within the center 768 x 768 pixels
- **Background Color:** Defined in `app.json` as `backgroundColor: "#ffffff"`

### Notification Icon (`assets/icon.png` used in notifications plugin)
- **Size:** 48 x 48 pixels minimum (but use the same 1024x1024 file)
- **Format:** PNG
- **Color:** Should work on white background (color: "#ffffff" in config)

## How to Fix

1. **Create/Update Icon Files:**
   ```bash
   # Make sure both files exist and are 1024x1024px
   assets/icon.png - 1024x1024px
   assets/adaptive-icon.png - 1024x1024px (with transparency, safe zone)
   ```

2. **Verify Icon Files:**
   - Open in image editor
   - Check dimensions (1024x1024)
   - For adaptive-icon: Ensure important content is within center 768x768 area

3. **Rebuild App:**
   ```bash
   eas build --platform android --profile production
   ```

## Icon Design Tips

- Keep designs simple and recognizable at small sizes
- Use high contrast for visibility
- Test how the icon looks at different sizes (especially small)
- Android adaptive icons can be masked (circle, rounded square, squircle)
- Ensure the icon represents your app clearly

## Testing Icons

After rebuilding, test the icon:
1. Install the app on a device
2. Check the app drawer/launcher
3. Check notification icons
4. Verify adaptive icon on Android (may show different shapes on different devices)
