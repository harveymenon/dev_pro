# 🔧 Fix: Tailwind CSS Native Binding Error

## ❌ The Error

```
Error: Cannot find native binding. npm has a bug related to optional dependencies
```

This error occurs during GitHub Actions build when using Tailwind CSS v4.

## 🔍 Why This Happens

1. **Tailwind CSS v4** uses `@tailwindcss/oxide` which has **platform-specific native bindings**
2. When you run `npm install` on your local machine (macOS/Windows/Linux), it only installs bindings for **that specific platform**
3. The `package-lock.json` records these platform-specific dependencies
4. When GitHub Actions runs on **Ubuntu Linux**, it tries to use `npm ci` which strictly follows the lock file
5. The Linux environment doesn't have the required native bindings → **Build fails**

## ✅ The Solution

### Quick Fix (Recommended)

**Option 1: Use the fix script**

**On macOS/Linux:**
```bash
chmod +x fix-build.sh
./fix-build.sh
```

**On Windows:**
```cmd
fix-build.bat
```

**Option 2: Manual fix**

```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Install fresh dependencies
npm install

# Test the build
npm run build

# Commit the new lock file
git add package-lock.json
git commit -m "Fix: Regenerate package-lock.json for cross-platform compatibility"
git push origin main
```

### What the Fix Does

1. **Deletes** `node_modules` and `package-lock.json`
2. **Clears** npm cache to remove any corrupted data
3. **Reinstalls** all dependencies fresh, generating a new `package-lock.json`
4. **Tests** the build to ensure everything works
5. The new lock file is **platform-agnostic** and works on GitHub Actions

## 🔧 GitHub Actions Workflow Updated

The workflow has been updated to use `npm install` instead of `npm ci`:

```yaml
- name: Install dependencies
  run: npm install  # Changed from: npm ci
```

This is more forgiving with platform-specific dependencies.

## 📋 Step-by-Step Fix

### Step 1: Run the Fix Script

**macOS/Linux:**
```bash
./fix-build.sh
```

**Windows:**
```cmd
fix-build.bat
```

### Step 2: Commit the Changes

```bash
git add package-lock.json
git commit -m "Fix: Regenerate package-lock.json for cross-platform compatibility"
git push origin main
```

### Step 3: Verify GitHub Actions

1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the "Deploy to GitHub Pages" workflow
4. It should now complete successfully ✅

## 🎯 Alternative Solutions

### Solution 1: Use `npm install` in CI (Already Applied)

The workflow now uses `npm install` instead of `npm ci`, which handles platform differences better.

### Solution 2: Add Optional Dependencies Explicitly

Add this to `package.json`:

```json
{
  "optionalDependencies": {
    "@tailwindcss/oxide-linux-x64-gnu": "^4.1.7",
    "@tailwindcss/oxide-darwin-x64": "^4.1.7",
    "@tailwindcss/oxide-win32-x64-msvc": "^4.1.7"
  }
}
```

Then run `npm install` again.

### Solution 3: Use Tailwind CSS v3

If the issue persists, you can downgrade to Tailwind CSS v3 which doesn't use native bindings:

```bash
npm uninstall tailwindcss @tailwindcss/vite
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
```

Then update your configuration files accordingly.

## 🔬 Understanding the Issue

### What are Native Bindings?

Native bindings are platform-specific compiled code (usually C/C++) that provide performance-critical functionality. They're different for:
- **Operating Systems**: Windows, macOS, Linux
- **Architectures**: x64, ARM64
- **libc versions**: glibc, musl

### Why npm ci Fails

`npm ci` (clean install) is designed for **reproducible builds**. It:
- Installs **exactly** what's in `package-lock.json`
- **Doesn't** resolve platform differences
- **Fails** if the lock file has dependencies for a different platform

### Why npm install Works

`npm install`:
- **Resolves** dependencies for the current platform
- **Handles** optional dependencies gracefully
- **More forgiving** with platform differences

## 📊 Build Status

After applying the fix:

✅ **Build should succeed**
✅ **GitHub Actions should pass**
✅ **Site should deploy correctly**

## 🆘 Troubleshooting

### Issue: Fix script doesn't work

**Solution:**
```bash
# Manual cleanup
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: Still getting native binding error

**Solution:**
1. Check Node.js version (should be 18+ or 20+)
2. Try using a different Node.js version in the workflow
3. Consider downgrading to Tailwind CSS v3

### Issue: Build works locally but fails on GitHub

**Solution:**
1. Make sure you committed the new `package-lock.json`
2. Check that the workflow uses `npm install` (not `npm ci`)
3. Clear GitHub Actions cache (Settings → Actions → Cache)

## 📚 Related Issues

- [npm/cli#4828](https://github.com/npm/cli/issues/4828) - npm optional dependencies bug
- [tailwindlabs/tailwindcss#12473](https://github.com/tailwindlabs/tailwindcss/issues/12473) - Tailwind CSS v4 native bindings

## ✅ Verification Checklist

After applying the fix, verify:

- [ ] `package-lock.json` has been regenerated
- [ ] Local build works: `npm run build`
- [ ] New `package-lock.json` is committed
- [ ] Changes pushed to GitHub
- [ ] GitHub Actions workflow runs successfully
- [ ] Site deploys to GitHub Pages

## 🎉 Success!

Once the fix is applied and pushed, your GitHub Actions workflow should complete successfully and your site will be deployed to GitHub Pages.

---

**Status:** ✅ Fix Applied  
**Workflow:** ✅ Updated to use `npm install`  
**Ready to Deploy:** ✅ Yes
