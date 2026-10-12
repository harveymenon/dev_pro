# 🔐 Access Control - Quick Start Guide

## ✅ Implementation Complete!

Your Gantt Chart Planner now has **secure access control** with a beautiful gate modal.

## 🚀 Get Started in 3 Steps

### Step 1: Generate Your Access Code Hash

**Open the hash generator:**
```bash
# Option A: Open locally
open public/hash-generator.html

# Option B: After deployment
https://your-domain.com/hash-generator.html
```

**Or use browser console:**
```javascript
// On deployed app, open console (F12) and run:
generateAccessHash('gantt2026');
```

**Default access code:** `gantt2026`

### Step 2: Update Configuration

Edit `src/config/accessConfig.ts`:
```typescript
export const ACCESS_CODE_HASH = 'your-generated-hash-here';
```

### Step 3: Deploy

```bash
npm run build
git add .
git commit -m "Add access control"
git push origin main
```

## 🎯 What Users See

When users open the app:

1. **Access Gate Modal** appears
2. They enter the access code
3. If correct → App loads (8-hour session)
4. If wrong → Error message with attempt counter
5. After 5 wrong attempts → 15-minute lockout

## 🔧 Quick Configuration

### Change Access Code
```bash
1. Open hash-generator.html
2. Enter new code
3. Copy hash
4. Update accessConfig.ts
5. Rebuild
```

### Change Session Duration
```typescript
// In accessConfig.ts
export const ACCESS_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Change Lockout Settings
```typescript
// In accessConfig.ts
export const MAX_ATTEMPTS = 3; // 3 attempts
export const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
```

## 📁 Files Created

| File | Purpose |
|------|---------|
| `src/config/accessConfig.ts` | Configuration |
| `src/utils/accessControl.ts` | Access logic |
| `src/components/AccessGate.tsx` | UI component |
| `public/hash-generator.html` | Hash generator tool |
| `ACCESS_CONTROL_*.md` | Documentation |

## 🧪 Test It

```bash
1. Open app in incognito window
2. See access gate modal
3. Enter "gantt2026" (or your code)
4. Access granted!
5. Refresh page - no gate (session active)
```

## 🛠️ Developer Tools

**Browser Console:**
```javascript
// Generate hash
generateAccessHash('new-code');

// Clear access
sessionStorage.removeItem('gantt_app_access_granted');

// Check status
sessionStorage.getItem('gantt_app_access_granted');
```

## 📚 Documentation

- **Quick Start:** This file
- **Setup Guide:** `ACCESS_CONTROL_SETUP.md`
- **Full Docs:** `ACCESS_CONTROL_README.md`
- **Summary:** `ACCESS_CONTROL_COMPLETE.md`

## ✅ Build Status

```
✓ 94 modules transformed
✓ Built in 7.27s
Build: Successful
```

## 🎉 You're Done!

Your application is now protected with access control. Users need to enter the code to access the app.

**Default code:** `gantt2026`  
**Session:** 8 hours  
**Lockout:** 5 attempts = 15 minutes

**Need to change the code?** Use the hash generator tool!

---

**Implementation Complete!** 🔐✨
