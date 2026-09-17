# Deploy to GitHub Pages with Supabase - Complete Guide

This guide will help you deploy your Gantt Chart Planner to GitHub Pages with your Supabase credentials securely configured.

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Your project pushed to GitHub
- ✅ Supabase project set up
- ✅ Supabase URL and anon key ready

## 🔐 Step 1: Add Supabase Credentials to GitHub Secrets

### Why Use Secrets?
GitHub Secrets keep your credentials secure and hidden from public view. They're encrypted and only accessible during GitHub Actions workflows.

### Add the Secrets

1. **Go to your GitHub repository**
   ```
   https://github.com/YOUR_USERNAME/gantt-chart-planner
   ```

2. **Navigate to Settings**
   - Click on the **"Settings"** tab (gear icon)
   - In the left sidebar, click **"Secrets and variables"** → **"Actions"**

3. **Add Supabase URL**
   - Click **"New repository secret"**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://abcdefgh.supabase.co`)
   - Click **"Add secret"**

4. **Add Supabase Anon Key**
   - Click **"New repository secret"** again
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon/public key (long string starting with `eyJ...`)
   - Click **"Add secret"**

### Where to Find Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"Settings"** → **"API"**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 🔧 Step 2: Configure Vite for GitHub Pages

### vite.config.js Configuration

Your `vite.config.js` is already configured for GitHub Pages:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Base path for GitHub Pages
  base: '/dev_pro/',
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
```

The `base` path is set to `/dev_pro/` which matches your GitHub repository name.

## 🚀 Step 3: Create GitHub Pages Deployment Workflow

Create a new file at `.github/workflows/deploy-pages.yml`:

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
        run: npm ci

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

## 🌐 Step 4: Enable GitHub Pages

1. **Go to your repository on GitHub**

2. **Navigate to Settings**
   - Click **"Settings"** tab
   - In the left sidebar, click **"Pages"**

3. **Configure GitHub Pages**
   - Under **"Build and deployment"**:
     - **Source**: Select **"GitHub Actions"**
   - Save the settings

4. **Wait for deployment**
   - GitHub will automatically build and deploy your site
   - Check the **"Actions"** tab to see the workflow progress
   - Once complete, your site will be live!

## 🎯 Step 5: Access Your Live Site

Your application will be available at:
```
https://YOUR_USERNAME.github.io/dev_pro/
```

Replace:
- `YOUR_USERNAME` with your GitHub username

## ✅ Step 6: Verify Everything Works

### Test the Deployment

1. **Open your live site**
   ```
   https://YOUR_USERNAME.github.io/gantt-chart-planner/
   ```

2. **Check the browser console**
   - Press F12 to open Developer Tools
   - Go to the Console tab
   - Look for any errors

3. **Verify Supabase connection**
   - If configured correctly, you should see data loading from Supabase
   - If not configured, the app will use sample data

4. **Test functionality**
   - Add a developer
   - Create a task
   - Export to Excel
   - Switch between tabs

## 🔍 Troubleshooting

### Issue: "Invalid supabaseUrl" error

**Solution:**
- Check that secrets are set correctly in GitHub
- Verify the URL starts with `https://`
- Make sure there are no extra spaces in the secret values

### Issue: 404 errors for assets

**Solution:**
- Check that `base` in `vite.config.js` matches your repository name
- Example: If repo is `dev_pro`, base should be `/dev_pro/`

### Issue: Blank page after deployment

**Solution:**
- Check browser console for errors
- Verify the build completed successfully in Actions tab
- Check that all files are in the `dist` folder

### Issue: Supabase data not loading

**Solution:**
- Verify secrets are set in GitHub
- Check that the workflow ran with the secrets
- Look at the Actions logs to see if secrets were passed correctly
- Ensure your Supabase project is active (not paused)

## 🔄 Updating Your Site

### Automatic Updates

Every time you push to the `main` branch:
1. GitHub Actions will automatically run
2. Build the project with your secrets
3. Deploy to GitHub Pages
4. Your site will be updated within 1-2 minutes

### Manual Deployment

To manually trigger a deployment:
1. Go to **"Actions"** tab
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

## 📊 Monitoring Your Deployment

### View Deployment Status

1. **Actions Tab**
   - See all workflow runs
   - Check build logs
   - View deployment status

2. **Deployments Tab**
   - See all deployments
   - Check environment status
   - View deployment URLs

### Check Build Logs

If something goes wrong:
1. Go to **"Actions"** tab
2. Click on the failed workflow run
3. Click on the failed job
4. Expand the steps to see detailed logs

## 🔒 Security Best Practices

### Keep Secrets Secure

✅ **DO:**
- Use GitHub Secrets for all credentials
- Never commit `.env` files
- Rotate keys periodically
- Use the anon key (public) not the service role key (private)

❌ **DON'T:**
- Hardcode credentials in code
- Commit secrets to git
- Share secrets in issues or discussions
- Use service role key in frontend

### Supabase Security

1. **Enable Row Level Security (RLS)**
   - Go to Supabase Dashboard → Authentication → Policies
   - Enable RLS on all tables

2. **Configure Policies**
   - For development: Allow all operations
   - For production: Restrict to authenticated users

3. **Monitor Usage**
   - Check Supabase Dashboard → Database → Logs
   - Monitor API usage
   - Set up alerts for unusual activity

## 📝 Complete Checklist

Before deploying, verify:

### GitHub Setup
- [ ] Repository created on GitHub
- [ ] Code pushed to `main` branch
- [ ] Secrets added (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] GitHub Pages enabled
- [ ] Source set to "GitHub Actions"

### Configuration
- [ ] `vite.config.js` has correct `base` path
- [ ] Deployment workflow created
- [ ] Workflow file committed and pushed

### Supabase Setup
- [ ] Supabase project created
- [ ] Database schema applied
- [ ] RLS policies configured
- [ ] Project is active (not paused)

### Testing
- [ ] Build succeeds locally (`npm run build`)
- [ ] GitHub Actions workflow runs successfully
- [ ] Site loads without errors
- [ ] Supabase data loads (if configured)
- [ ] All features work correctly

## 🎉 You're Live!

Your Gantt Chart Planner is now:
- ✅ Hosted on GitHub Pages
- ✅ Connected to Supabase
- ✅ Automatically deployed on every push
- ✅ Accessible to anyone with the URL
- ✅ Secure with encrypted secrets

### Share Your Site

Share your live site:
```
https://YOUR_USERNAME.github.io/gantt-chart-planner/
```

### Custom Domain (Optional)

To use a custom domain:
1. Go to **Settings** → **Pages**
2. Under **"Custom domain"**, enter your domain
3. Configure DNS settings with your domain provider
4. Wait for DNS propagation (can take up to 24 hours)

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)

## 🆘 Need Help?

If you encounter issues:
1. Check the **Actions** tab for build logs
2. Review browser console for errors
3. Verify all secrets are set correctly
4. Check that `base` path matches repository name
5. Review this guide's troubleshooting section

---

**Your Gantt Chart Planner is now live on GitHub Pages with Supabase integration! 🚀**
