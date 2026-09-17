# GitHub Setup Guide

This guide will help you push your Gantt Chart Planner project to GitHub and set up your repository.

## 📋 Prerequisites

- GitHub account ([sign up here](https://github.com/signup))
- Git installed on your computer
- Command line / Terminal access

## 🚀 Step-by-Step Setup

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the **"+"** button in the top right
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `gantt-chart-planner` (or your preferred name)
   - **Description**: `A modern Gantt chart application for project management`
   - **Public** or **Private** (your choice)
   - ✅ Check **"Add a README file"** (optional, we already have one)
   - ❌ **Don't** add .gitignore (we already have one)
   - ❌ **Don't** add a license (we already have one)
5. Click **"Create repository"**

### Step 2: Initialize Local Git Repository

Open your terminal in the project directory:

```bash
# Navigate to your project folder
cd path/to/gantt-chart-planner

# Initialize git repository (if not already done)
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Gantt Chart Planner with Supabase integration"
```

### Step 3: Connect to GitHub

```bash
# Add GitHub as remote origin
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/gantt-chart-planner.git

# Verify remote was added
git remote -v
```

### Step 4: Push to GitHub

```bash
# Rename main branch (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 5: Verify

1. Go to your GitHub repository page
2. Refresh the page
3. You should see all your project files!

## 🔧 Post-Setup Configuration

### Enable GitHub Features

1. **Issues**: Already enabled by default
2. **Projects**: Enable for project management
3. **Discussions**: Enable for community questions
4. **Wiki**: Enable for documentation
5. **Security**: Review security settings

### Set Up Branch Protection

1. Go to **Settings** → **Branches**
2. Click **"Add rule"**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators (optional)

### Configure Secrets (for CI/CD)

If you want automated deployments:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VERCEL_TOKEN`: (if using Vercel)
   - `NETLIFY_AUTH_TOKEN`: (if using Netlify)

### Set Up GitHub Pages (Optional)

To host your app on GitHub Pages:

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```
3. Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/gantt-chart-planner/',
     // ... rest of config
   })
   ```
4. Deploy:
   ```bash
   npm run build
   npm run deploy
   ```
5. Go to **Settings** → **Pages**
6. Select **gh-pages** branch
7. Your site will be live at: `https://YOUR_USERNAME.github.io/gantt-chart-planner/`

## 📊 Using GitHub Features

### Issues

Create issues for:
- Bug reports
- Feature requests
- Questions
- Documentation improvements

Use the templates we created:
- Bug Report template
- Feature Request template

### Pull Requests

When contributing:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit
3. Push to GitHub: `git push origin feature/your-feature`
4. Create Pull Request on GitHub
5. Use the PR template we created

### Actions (CI/CD)

We've set up two workflows:

1. **CI Workflow** (`ci.yml`):
   - Runs on every push and PR
   - Tests the build
   - Checks for errors

2. **Deploy Workflow** (`deploy.yml`):
   - Runs on push to main
   - Builds production version
   - Deploys to hosting service (if configured)

View workflow runs in the **Actions** tab.

### Dependabot

Automated dependency updates are configured:
- Weekly checks for npm updates
- Weekly checks for GitHub Actions updates
- Automatic PRs for updates

View in **Insights** → **Dependency graph** → **Dependabot**

## 🔄 Daily Workflow

### Making Changes

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make your changes
# ...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
```

### Syncing with Remote

```bash
# Fetch latest changes
git fetch origin

# View status
git status

# Pull changes
git pull origin main
```

### Viewing History

```bash
# View commit history
git log

# View compact history
git log --oneline --graph

# View specific file history
git log -- path/to/file
```

## 🎯 Best Practices

### Commit Messages

Follow conventional commits:
```bash
feat: add dark mode
fix: correct date calculation
docs: update README
style: format code
refactor: improve performance
test: add unit tests
chore: update dependencies
```

### Branch Naming

```bash
feature/add-dark-mode
fix/date-calculation-bug
docs/update-readme
refactor/improve-performance
```

### Pull Requests

- Keep PRs small and focused
- Write clear descriptions
- Add screenshots for UI changes
- Link related issues
- Request reviews from team members

### Code Reviews

- Review all PRs before merging
- Check for:
  - Code quality
  - Security issues
  - Performance impact
  - Test coverage
  - Documentation updates

## 🔒 Security Checklist

Before making repository public:

- [ ] Remove sensitive data from code
- [ ] Check `.env` is in `.gitignore`
- [ ] Review `.gitignore` covers all sensitive files
- [ ] Check commit history for secrets
- [ ] Enable branch protection
- [ ] Set up required status checks
- [ ] Configure secret scanning
- [ ] Review security policy

## 📈 Repository Health

### Badges

Add badges to your README:

```markdown
![CI](https://github.com/YOUR_USERNAME/gantt-chart-planner/workflows/CI/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/gantt-chart-planner)
```

### Insights

Monitor repository health:
- **Pulse**: Recent activity
- **Contributors**: Who's contributing
- **Network**: Forks and dependencies
- **Community**: Community standards
- **Traffic**: Visitor statistics

## 🆘 Troubleshooting

### Authentication Issues

```bash
# Use HTTPS
git remote set-url origin https://github.com/YOUR_USERNAME/gantt-chart-planner.git

# Or use SSH
git remote set-url origin git@github.com:YOUR_USERNAME/gantt-chart-planner.git
```

### Push Rejected

```bash
# Pull changes first
git pull origin main --rebase

# Then push
git push origin main
```

### Large Files

If you accidentally committed large files:

```bash
# Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/large-file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
```

## 📚 Additional Resources

- [GitHub Documentation](https://docs.github.com)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI](https://cli.github.com/)

## ✅ Verification Checklist

After setup, verify:

- [ ] Repository created on GitHub
- [ ] All files pushed successfully
- [ ] README displays correctly
- [ ] CI workflow runs successfully
- [ ] Branch protection enabled
- [ ] Issues templates working
- [ ] PR template working
- [ ] Dependabot configured
- [ ] Security settings reviewed

---

**Your Gantt Chart Planner is now on GitHub! 🎉**

Next steps:
1. Share your repository
2. Start accepting contributions
3. Set up project boards
4. Plan your roadmap
5. Build amazing features!
