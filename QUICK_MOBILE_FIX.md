# Quick Mobile App Connection Fix

Since it worked before, try these in order:

## 1. Restart Mobile App (Most Common Fix)

**Expo:**
- Shake your device → "Reload" 
- Or press `r` in the Expo terminal

**If using Expo Go:**
- Close the app completely
- Reopen Expo Go
- Scan QR code again

## 2. Check Network Connection

**Verify both devices are on same network:**
- Your computer: Check Wi-Fi name
- Your mobile device: Check Wi-Fi name
- They must match!

## 3. Clear Expo Cache

```bash
cd mobile-app
npm start -- --clear
```

Or:
```bash
cd mobile-app
npx expo start -c
```

## 4. Verify IP Address

Your current IP: `192.168.7.97`

**If your IP changed:**
1. Check current IP: `ipconfig | findstr IPv4`
2. Update `mobile-app/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_CURRENT_IP:3000
   ```
3. Restart Expo: `npm start -- --clear`

## 5. Test from Mobile Browser

On your mobile device, open browser and go to:
```
http://192.168.7.97:3000/api
```

**If this works:** Server is reachable, issue is with Expo/app
**If this doesn't work:** Network/firewall issue

## 6. Check Mobile App Console

Look at the Expo terminal or device logs for the actual error message. Common errors:
- `Network request failed` → Network/firewall
- `Connection refused` → Server not running or wrong IP
- `CORS error` → Server CORS config (but yours looks fine)

## 7. Restart Backend Server

Sometimes the server needs a restart:
```bash
cd todo-backend
# Stop (Ctrl+C) then:
npm run start:dev
```

## Most Likely Solution

Since it worked before, it's probably:
1. **Expo cache** → Run `npm start -- --clear`
2. **Network changed** → Verify same Wi-Fi
3. **App needs reload** → Shake device → Reload
