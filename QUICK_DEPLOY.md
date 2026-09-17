# Quick Deploy Guide - 5 Minutes to Live Site

Follow these exact steps to deploy your Gantt Chart Planner to GitHub Pages with Supabase.

## 🎯 What You'll Need

1. Your Supabase URL (from Settings → API)
2. Your Supabase anon key (from Settings → API)
3. Your GitHub repository name

## 📝 Step-by-Step Instructions

### Step 1: Add Secrets to GitHub (2 minutes)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

**Secret 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://your-project-id.supabase.co`

**Secret 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full anon key)

### Step 2: Update Repository Name in Config (1 minute)

Open `vite.config.js` and change the `base` path:

```javascript
base: '/YOUR-REPOSITORY-NAME/',
```

Replace `YOUR-REPOSITORY-NAME` with your actual GitHub repository name.

**Example:**
- If your repo is `gantt-chart-planner`, use: `base: '/gantt-chart-planner/'`
- If your repo is `my-gantt-app`, use: `base: '/my-gantt-app/'`

### Step 3: Commit and Push (1 minute)

```bash
git add vite.config.js
git commit -m "Configure for GitHub Pages deployment"
git push origin main
```

### Step 4: Enable GitHub Pages (1 minute)

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**
4. Save

### Step 5: Wait for Deployment (1-2 minutes)

1. Go to **Actions** tab
2. You'll see "Deploy to GitHub Pages" workflow running
3. Wait for it to complete (green checkmark)

### Step 6: Access Your Live Site

Your site will be live at:
```
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

**Example:**
```
https://johndoe.github.io/gantt-chart-planner/
```

## ✅ Verification Checklist

After deployment, verify:

- [ ] Site loads without errors
- [ ] No "Invalid supabaseUrl" error in console
- [ ] Data loads from Supabase (or sample data if not configured)
- [ ] Can add/edit/delete developers
- [ ] Can add/edit/delete tasks
- [ ] Gantt chart displays correctly
- [ ] Excel export works

## 🔧 Common Issues & Solutions

### Issue: "Invalid supabaseUrl" error

**Fix:** Check that secrets are set correctly:
1. Go to Settings → Secrets and variables → Actions
2. Verify `VITE_SUPABASE_URL` starts with `https://`
3. Verify `VITE_SUPABASE_ANON_KEY` is the full key (no extra spaces)

### Issue: 404 errors for assets

**Fix:** Update `base` in `vite.config.js`:
```javascript
base: '/your-repo-name/',
```

### Issue: Blank page

**Fix:** Check browser console (F12) for errors. Common causes:
- Incorrect `base` path in vite.config.js
- Missing secrets
- Build failed (check Actions tab)

### Issue: Supabase not connecting

**Fix:** 
1. Verify secrets are set in GitHub
2. Check Supabase project is active (not paused)
3. Check Actions logs to see if secrets were used
4. Re-run the workflow manually

## 🔄 How to Update Your Site

Every time you push to `main`:
1. GitHub Actions automatically runs
2. Builds with your secrets
3. Deploys to GitHub Pages
4. Site updates in 1-2 minutes

## 📊 What Happens Behind the Scenes

```
You push code to main
    ↓
GitHub Actions triggers
    ↓
Installs dependencies (npm ci)
    ↓
Builds with your secrets
    ↓
Creates production build in dist/
    ↓
Uploads to GitHub Pages
    ↓
Site goes live!
```

## 🎉 You're Done!

Your Gantt Chart Planner is now:
- ✅ Live on GitHub Pages
- ✅ Connected to Supabase
- ✅ Automatically deployed on every push
- ✅ Accessible to anyone

**Share your site:**
```
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

## 📞 Need Help?

- Check **Actions** tab for build logs
- Check browser console (F12) for errors
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting

---

**That's it! Your site is live in 5 minutes! 🚀**
