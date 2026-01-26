# Troubleshooting Mobile App Connection to Backend

## Problem
The mobile app cannot connect to the backend server, while the web app works fine.

## Current Configuration
- **Server**: Running on `0.0.0.0:3000` ✅
- **Your IP**: `192.168.7.97` ✅
- **Mobile App Config**: `http://192.168.7.97:3000` ✅

## Common Issues & Solutions

### 1. Windows Firewall Blocking Port 3000

**Solution**: Add a firewall rule (requires admin privileges)

1. Open PowerShell or Command Prompt **as Administrator**
2. Run:
   ```powershell
   netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000
   ```

### 2. Mobile Device Not on Same Network

**Check**: 
- Your computer and mobile device must be on the same Wi-Fi network
- Verify your device's Wi-Fi network matches your computer's network

**Solution**: 
- Connect both devices to the same Wi-Fi network
- If using mobile hotspot, ensure both are connected to it

### 3. IP Address Changed

**Check**: Your IP might have changed after reconnecting to Wi-Fi

**Solution**:
1. Find your current IP:
   - Windows: `ipconfig | findstr IPv4`
   - Mac/Linux: `ifconfig` or `ip addr`
2. Update `mobile-app/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_NEW_IP:3000
   ```
3. Restart the Expo app (shake device → Reload)

### 4. Android Emulator Special Case

If using Android Emulator, use:
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### 5. iOS Simulator

iOS Simulator can use:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 6. Test Connection

Test if the server is reachable from your mobile device:

1. Open a browser on your mobile device
2. Navigate to: `http://192.168.7.97:3000/api` (should show Swagger docs)
3. If this doesn't work, the firewall is likely blocking it

### 7. Restart Everything

After making changes:
1. Stop the backend server (Ctrl+C)
2. Restart the backend: `cd todo-backend && npm run start:dev`
3. Restart Expo: `cd mobile-app && npm start`
4. Reload the mobile app (shake device → Reload)

## Quick Test Commands

```powershell
# Check if server is listening
netstat -ano | findstr :3000

# Check your IP
ipconfig | findstr IPv4

# Test from mobile browser
# Open: http://192.168.7.97:3000/api
```

## Still Not Working?

1. **Check server logs** - Are requests reaching the server?
2. **Check mobile app console** - What error is shown?
3. **Try ping test** - Can your mobile device ping your computer's IP?
4. **Check antivirus** - Some antivirus software blocks network connections
