# Quick Fix: Connection Error When Scanning QR Code

## Issues Found and Fixed

### 1. ✅ CORS Missing (FIXED)
- **Problem**: Backend wasn't allowing requests from mobile app
- **Fix**: Added CORS configuration to `todo-backend/src/main.ts`

### 2. ⚠️ IP Address Mismatch (UPDATED)
- **Old IP**: `192.168.68.55:3000`
- **Current IP**: `192.168.7.97:3000`
- **Fix**: Updated `mobile-app/src/config/api.ts` to use current IP

## Steps to Fix Connection

### Step 1: Update .env file (if using)
Update `mobile-app/.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.7.97:3000
```

### Step 2: Restart Backend
```bash
cd todo-backend
npm run start:dev
```

Make sure you see:
```
[Nest] ... Application is running on: http://[::1]:3000
```

### Step 3: Restart Expo
```bash
cd mobile-app
npm start
```

Then scan the QR code again.

### Step 4: Verify Connection
Check the Expo console - you should see:
```
API Base URL: http://192.168.7.97:3000
```

## Troubleshooting

### If still not connecting:

1. **Check IP Address**:
   ```powershell
   ipconfig | Select-String "IPv4"
   ```
   Update the IP in `mobile-app/src/config/api.ts` if different.

2. **Verify Backend is Running**:
   Open browser: `http://192.168.7.97:3000/api` (should show Swagger UI)

3. **Check Firewall**:
   - Windows Firewall might block port 3000
   - Allow Node.js through firewall if prompted

4. **Same Network**:
   - Phone and computer must be on the same Wi-Fi network
   - Don't use VPN on either device

5. **Clear Expo Cache**:
   ```bash
   cd mobile-app
   npx expo start -c
   ```

## Common Error Messages

- **"Network error: Cannot reach server"** → Backend not running or wrong IP
- **"CORS error"** → Backend CORS not enabled (should be fixed now)
- **"Connection refused"** → Firewall blocking or backend crashed
