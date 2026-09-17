# Quick Start Guide - Supabase Integration

Get your Gantt Chart Planner running with Supabase in 5 minutes!

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Supabase Project (2 minutes)
1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project"
3. Enter project name: `gantt-chart-planner`
4. Set a database password
5. Choose your region
6. Click "Create new project"
7. Wait for the project to be ready (~2 minutes)

### Step 2: Set Up Database (1 minute)
1. In your Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 3: Get Your Credentials (30 seconds)
1. Click "Settings" → "API" in the left sidebar
2. Copy these two values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### Step 4: Configure Your App (30 seconds)
1. In your project folder, create a file named `.env`
2. Add these lines (replace with your actual values):
   ```env
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Save the file

### Step 5: Run Your App (30 seconds)
```bash
npm install
npm run dev
```

Open your browser to the URL shown (usually `http://localhost:5173`)

## ✅ That's It!

Your Gantt Chart Planner is now connected to Supabase! 

### What You Can Do Now:
- ✅ Create developers and tasks
- ✅ All data automatically saves to the cloud database
- ✅ Access your data from any device/browser
- ✅ Data persists even if you clear browser cache
- ✅ Share the app with others (they'll see the same data)

## 🔧 Need Help?

### Common Issues:

**"Data not loading"**
- Check your `.env` file has the correct URL and key
- Make sure you ran the SQL script in Supabase
- Check browser console for errors

**"Changes not saving"**
- Verify your Supabase project is active (not paused)
- Check you're connected to the internet
- Look for errors in browser console

**"Can't find my data in another browser"**
- Make sure both browsers are using the same `.env` credentials
- Check that you're accessing the same Supabase project

### Detailed Help:
- Full setup guide: `SUPABASE_SETUP.md`
- Integration details: `SUPABASE_INTEGRATION.md`
- Database schema: `supabase-schema.sql`

## 🎯 Next Steps

1. **Test the app**: Create a developer, add some tasks
2. **Try another device**: Open the app on your phone or another computer
3. **Refresh the page**: Your data should still be there
4. **Share with team**: Give them your Supabase credentials (for development)

## 📝 Important Notes

- **Security**: The `.env` file contains sensitive credentials. Never commit it to Git!
- **Free Tier**: Supabase free tier pauses after 7 days of inactivity
- **Production**: For production use, add authentication and restrict access

## 🆘 Still Stuck?

1. Check the browser console (F12) for error messages
2. Verify your Supabase project is active in the dashboard
3. Double-check your `.env` file format (no extra spaces)
4. Try the detailed setup guide: `SUPABASE_SETUP.md`

---

**Happy Planning! 📊✨**
