# Access Control Setup Guide

## 🔐 Overview

The application now includes a secure access gate that requires a secret code to enter. The code is stored as a hash in the frontend, providing basic security while keeping the app simple.

## 🎯 Features

- ✅ **Secure Access Gate**: Beautiful modal popup requiring access code
- ✅ **Hashed Storage**: Code stored as hash, not plain text
- ✅ **Session Management**: 8-hour session duration
- ✅ **Lockout Protection**: 5 failed attempts = 15-minute lockout
- ✅ **Attempt Tracking**: Shows remaining attempts
- ✅ **Countdown Timer**: Shows lockout remaining time
- ✅ **Responsive Design**: Works on all devices

## 🚀 Quick Setup

### Step 1: Generate Your Access Code Hash

Open your browser console on the deployed app and run:

```javascript
// This will show you the hash for any code you want to use
generateAccessHash('your-secret-code');
```

**Example:**
```javascript
generateAccessHash('gantt2026');
// Output: Hash for "gantt2026": [hash-value]
// Add this to accessConfig.ts: export const ACCESS_CODE_HASH = '[hash-value]';
```

### Step 2: Update the Configuration

Open `src/config/accessConfig.ts` and update the hash:

```typescript
export const ACCESS_CODE_HASH = 'your-generated-hash-here';
```

### Step 3: Rebuild and Deploy

```bash
npm run build
git add .
git commit -m "Update access code"
git push origin main
```

## 🔧 Configuration Options

### File: `src/config/accessConfig.ts`

```typescript
// The hashed access code (generate using generateAccessHash utility)
export const ACCESS_CODE_HASH = '5f4dcc3b5aa765d61d8327deb882cf99';

// Session duration (default: 8 hours)
export const ACCESS_SESSION_DURATION = 8 * 60 * 60 * 1000;

// Maximum failed attempts before lockout
export const MAX_ATTEMPTS = 5;

// Lockout duration (default: 15 minutes)
export const LOCKOUT_DURATION = 15 * 60 * 1000;

// App name displayed on the gate
export const APP_NAME = 'Gantt Chart Planner';
```

## 🎨 Customization

### Change Access Code

1. Open browser console
2. Run: `generateAccessHash('new-code')`
3. Copy the hash value
4. Update `ACCESS_CODE_HASH` in `src/config/accessConfig.ts`
5. Rebuild and deploy

### Change Session Duration

Edit `ACCESS_SESSION_DURATION` in milliseconds:
- 1 hour: `60 * 60 * 1000`
- 8 hours: `8 * 60 * 60 * 1000` (default)
- 24 hours: `24 * 60 * 60 * 1000`

### Change Lockout Settings

Edit these values:
- `MAX_ATTEMPTS`: Number of failed attempts before lockout (default: 5)
- `LOCKOUT_DURATION`: Lockout duration in milliseconds (default: 15 minutes)

### Change App Name

Edit `APP_NAME` to change the title shown on the access gate.

## 🔒 Security Notes

### Current Security Level: Basic

This implementation provides **basic frontend security**:
- ✅ Code is hashed, not stored in plain text
- ✅ Session-based access (expires after 8 hours)
- ✅ Lockout after failed attempts
- ✅ No plain text code in source

### Limitations

⚠️ **Important**: This is frontend-only security. The hash is visible in the JavaScript bundle, so a determined attacker could reverse-engineer it. For production use with sensitive data, consider:

1. **Backend Authentication**: Add server-side validation
2. **Environment Variables**: Store hash in environment variables
3. **OAuth/SSO**: Use proper authentication providers
4. **API Keys**: Require API keys for data access

### Recommended for:
- ✅ Internal tools
- ✅ Demo applications
- ✅ Client presentations
- ✅ Basic access control

### Not Recommended for:
- ❌ Highly sensitive data
- ❌ Public-facing applications
- ❌ Regulatory compliance requirements
- ❌ Multi-tenant applications

## 🧪 Testing

### Test Access Gate

1. Open the application in a new incognito/private window
2. You should see the access gate modal
3. Try entering a wrong code
4. Verify error message appears
5. Try entering the correct code
6. Verify access is granted

### Test Session Management

1. Enter the correct code
2. Refresh the page - should NOT show gate
3. Wait 8 hours (or clear sessionStorage)
4. Refresh - should show gate again

### Test Lockout

1. Enter wrong code 5 times
2. Verify lockout message appears
3. Verify countdown timer shows
4. Wait 15 minutes (or clear sessionStorage)
5. Verify access is restored

### Test Hash Generation

1. Open browser console
2. Run: `generateAccessHash('test123')`
3. Verify hash is displayed
4. Copy the hash
5. Update `ACCESS_CODE_HASH` in config
6. Rebuild and test with 'test123'

## 📊 Access Flow

```
User opens app
    ↓
Check sessionStorage for valid session
    ↓
├─ Valid session → Show app
└─ No session → Show access gate
                    ↓
              Enter access code
                    ↓
              Hash the code
                    ↓
              Compare with stored hash
                    ↓
        ┌─ Match → Grant access, save session
        └─ No match → Record failed attempt
                        ↓
                ┌─ < 5 attempts → Show error
                └─ ≥ 5 attempts → Lock for 15 minutes
```

## 🛠️ Developer Tools

### Browser Console Commands

```javascript
// Generate hash for a new code
generateAccessHash('my-new-code');

// Check current access status
sessionStorage.getItem('gantt_app_access_granted');

// Clear access (force re-authentication)
sessionStorage.removeItem('gantt_app_access_granted');

// Check lockout status
JSON.parse(sessionStorage.getItem('gantt_app_access_granted'));
```

### Debug Mode

To debug access issues, check:
1. Browser console for error messages
2. sessionStorage for access data
3. Network tab for any API calls
4. Application tab → Session Storage

## 📝 Default Access Code

The default access code is: **`gantt2026`**

To change it:
1. Generate hash: `generateAccessHash('new-code')`
2. Update `ACCESS_CODE_HASH` in config
3. Rebuild and deploy

## 🎯 Use Cases

### Internal Team Tool
- Share access code with team members
- Prevent unauthorized access
- Session-based convenience

### Client Demo
- Set temporary access code
- Share with client for demo
- Code expires after session

### Staging Environment
- Protect staging from public
- Allow team access with code
- Different code per environment

## 🔐 Best Practices

1. **Use Strong Codes**: Minimum 8 characters, mix of letters/numbers
2. **Rotate Codes**: Change access code periodically
3. **Limit Distribution**: Only share with authorized users
4. **Monitor Access**: Check logs for unauthorized attempts
5. **Combine with Other Security**: Use HTTPS, secure headers, etc.

## 🆘 Troubleshooting

### Issue: Can't access the app
**Solution**: Clear browser data and try again, or check the access code

### Issue: Lockout won't clear
**Solution**: Clear sessionStorage: `sessionStorage.clear()`

### Issue: Hash doesn't match
**Solution**: Regenerate hash and update config, rebuild app

### Issue: Session expires too quickly
**Solution**: Increase `ACCESS_SESSION_DURATION` in config

## 📚 Related Files

- `src/config/accessConfig.ts` - Configuration
- `src/utils/accessControl.ts` - Access control logic
- `src/components/AccessGate.tsx` - Access gate UI
- `src/App.tsx` - Integration point

## ✅ Implementation Checklist

- [x] Access gate component created
- [x] Hash-based code storage
- [x] Session management
- [x] Lockout protection
- [x] Attempt tracking
- [x] Countdown timer
- [x] Responsive design
- [x] Hash generation utility
- [x] Configuration options
- [x] Documentation

---

**Status**: ✅ Complete and ready to use  
**Default Code**: `gantt2026`  
**Build**: ✅ Successful
