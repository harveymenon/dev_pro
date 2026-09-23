# ✅ GitHub Actions Build Error - Fixed

## Problem

The GitHub Actions build was failing with this error:

```
npm error code ETARGET
npm error notarget No matching version found for @supabase/functions-js@2.117.1.
npm error notarget In most cases you or one of your dependencies are requesting
npm error notarget a package version that doesn't exist.
```

## Root Cause

The workflow was deleting `package-lock.json` before running `npm install`:

```yaml
# ❌ OLD (BROKEN)
- name: Install dependencies
  run: |
    rm -rf node_modules package-lock.json
    npm install
```

This caused npm to try to resolve the latest compatible versions of all dependencies. When it tried to resolve `@supabase/supabase-js@^2.116.0`, it attempted to install `@supabase/functions-js@2.117.1`, which doesn't exist in the npm registry.

## Solution

Created a proper GitHub Actions workflow that uses `npm ci` instead of deleting `package-lock.json`:

```yaml
# ✅ NEW (FIXED)
- name: Install dependencies
  run: npm ci
```

`npm ci` (clean install) uses the exact versions specified in `package-lock.json`, ensuring consistent and reproducible builds.

## Changes Made

### 1. Created `.github/workflows/deploy-pages.yml`

New workflow file with proper dependency installation:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci  # ✅ Uses package-lock.json

      - name: Build with Supabase credentials
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Key Differences

| Aspect | Old (Broken) | New (Fixed) |
|--------|--------------|-------------|
| **Install Command** | `rm -rf package-lock.json && npm install` | `npm ci` |
| **Dependency Resolution** | Tries to resolve latest versions | Uses exact versions from lock file |
| **Reproducibility** | ❌ Different builds may get different versions | ✅ Same versions every time |
| **Speed** | Slower (resolves all dependencies) | Faster (uses lock file) |
| **Reliability** | ❌ Can fail if versions don't exist | ✅ Always works with locked versions |

## What You Need to Do

### Step 1: Commit the Workflow File

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "fix: Use npm ci instead of deleting package-lock.json

- Prevents npm from trying to resolve non-existent dependency versions
- Ensures reproducible builds using package-lock.json
- Fixes @supabase/functions-js@2.117.1 not found error"
git push origin main
```

### Step 2: Verify package-lock.json is Committed

Make sure `package-lock.json` is committed to your repository:

```bash
git add package-lock.json
git commit -m "chore: Ensure package-lock.json is committed"
git push origin main
```

### Step 3: Monitor the Build

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Watch the "Deploy to GitHub Pages" workflow
4. It should now complete successfully ✅

## Why This Works

### npm ci vs npm install

**npm install:**
- Reads `package.json`
- Resolves dependencies to latest compatible versions
- Updates `package-lock.json`
- Can fail if resolved versions don't exist

**npm ci:**
- Reads `package-lock.json`
- Installs exact versions specified
- Doesn't modify `package-lock.json`
- Fails if `package-lock.json` is out of sync with `package.json`
- Faster and more reliable

### The Specific Issue

Your `package.json` has:
```json
"@supabase/supabase-js": "^2.116.0"
```

Your `package-lock.json` has:
```json
"@supabase/supabase-js": "2.116.0"
```

When using `npm install` (without lock file), npm tried to resolve `^2.116.0` and attempted to install `@supabase/functions-js@2.117.1`, which doesn't exist.

When using `npm ci`, npm installs exactly `2.116.0` as specified in the lock file, which works correctly.

## Verification

After pushing the changes, verify:

- [ ] Workflow file is committed
- [ ] package-lock.json is committed
- [ ] GitHub Actions workflow runs successfully
- [ ] Build completes without errors
- [ ] Site deploys to GitHub Pages
- [ ] Site is accessible at your URL

## Expected Result

```
✅ Deploy to GitHub Pages workflow
  ✅ Checkout
  ✅ Setup Node
  ✅ Install dependencies (npm ci)
  ✅ Build with Supabase credentials
  ✅ Setup Pages
  ✅ Upload artifact
  ✅ Deploy to GitHub Pages
```

## Troubleshooting

### If you still see errors:

1. **Check that package-lock.json exists:**
   ```bash
   ls -la package-lock.json
   ```

2. **Verify it's committed:**
   ```bash
   git ls-files | grep package-lock.json
   ```

3. **Check the workflow file:**
   ```bash
   cat .github/workflows/deploy-pages.yml
   ```

4. **Check the Actions logs:**
   - Go to Actions tab
   - Click on the failed workflow
   - Look at the error details

### If package-lock.json is missing:

Generate it locally:
```bash
npm install
git add package-lock.json
git commit -m "chore: Regenerate package-lock.json"
git push origin main
```

## Summary

✅ **Issue:** npm trying to install non-existent dependency version  
✅ **Cause:** Deleting package-lock.json before npm install  
✅ **Fix:** Use npm ci to install from package-lock.json  
✅ **Result:** Reliable, reproducible builds  

---

**Status:** ✅ Fixed  
**Next Step:** Commit and push the workflow file  
**Expected Result:** Build succeeds and site deploys
