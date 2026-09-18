# 🔧 Supabase Save Issue - Debugging Guide

## Problem
Tasks are not getting saved to Supabase database.

## Solution Applied
Added comprehensive logging throughout the save/load process to identify where the issue is occurring.

## 🔍 How to Debug

### Step 1: Open Browser Console
1. Open your app in the browser
2. Press `F12` to open Developer Tools
3. Click on the **Console** tab
4. Clear any existing logs (click the 🚫 icon)

### Step 2: Refresh the App
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Watch the console logs

### Step 3: Check the Logs

You should see logs like this:

```
🚀 Initializing app...
📡 Supabase is configured, attempting to load data...
📡 Fetching app state from Supabase...
📡 Fetching developers...
✅ Fetched X developers
📡 Fetching tasks...
✅ Fetched X tasks
📡 Fetching settings...
✅ Fetched settings: X entries
✅ App state fetched successfully: { developers: X, tasks: X, projects: X, workingHoursPerDay: X }
```

### Step 4: Create or Edit a Task
1. Click "Add Task" or edit an existing task
2. Fill in the details and save
3. Watch the console logs

You should see:

```
🔄 State changed, saving to Supabase... { developers: X, tasks: X, projects: X, workingHoursPerDay: X }
💾 Attempting to save app state to Supabase...
  - Supabase client: ✓ Available
  - Developers: X
  - Tasks: X
  - Working Hours: X
  - Projects: X
🔄 Saving developers...
✅ Developers saved successfully
🔄 Saving tasks...
💾 Saving tasks to Supabase... X tasks
📊 Existing tasks: X Current tasks: X
✅ Tasks saved successfully - Inserted: X Updated: X
🔄 Saving settings...
💾 Attempting to save working hours: X
✅ App state saved successfully to Supabase
```

## 🐛 Common Issues and Solutions

### Issue 1: "Supabase not configured"
**Log shows:**
```
⚠️ Supabase not configured, using sample data
```

**Solution:**
1. Check that you have a `.env` file with:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Make sure the values are correct (no typos)
3. Restart the dev server: `npm run dev`

### Issue 2: "Error fetching tasks"
**Log shows:**
```
❌ Error fetching tasks: { message: "...", code: "..." }
```

**Solution:**
1. Check Supabase dashboard → Table Editor
2. Verify the `tasks` table exists
3. Check if the required columns exist:
   - `id` (text, primary key)
   - `title` (text)
   - `project` (text)
   - `jira_url` (text)
   - `hours` (integer)
   - `start_date` (date)
   - `end_date` (date)
   - `assigned_developer_id` (text, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)
4. If columns are missing, run the SQL schema update

### Issue 3: "Error inserting task" or "Error updating task"
**Log shows:**
```
❌ Error inserting task TASK-001 : { message: "...", code: "..." }
```

**Solution:**
1. Check the error message in the console
2. Common errors:
   - **Duplicate key**: Task ID already exists - use a unique ID
   - **Null constraint**: Required field is null - check all fields are filled
   - **Foreign key constraint**: Developer ID doesn't exist - create developer first
   - **Permission denied**: RLS policy is blocking - check RLS policies

### Issue 4: No logs at all
**Problem:** Console is empty or only shows initial logs

**Solution:**
1. Check if `isSupabaseConfigured()` returns true
2. Add this to browser console:
   ```javascript
   console.log('Supabase configured:', import.meta.env.VITE_SUPABASE_URL ? 'Yes' : 'No');
   ```
3. If it says "No", your `.env` file is not being loaded

### Issue 5: Data loads but doesn't save
**Log shows:**
```
✅ App state fetched successfully: { developers: X, tasks: X, ... }
```
But no save logs appear when you make changes.

**Solution:**
1. Check if the save useEffect is triggering
2. Verify `isLoading` is `false` after initial load
3. Check if state is actually changing (React might not detect changes)
4. Try making a change and immediately check console

## 📊 Verify Data in Supabase

### Check via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click **Table Editor** in the left sidebar
3. Click on **tasks** table
4. You should see your tasks listed

### Check via SQL Editor
Run this query in Supabase SQL Editor:
```sql
SELECT 
  id,
  title,
  project,
  jira_url,
  hours,
  start_date,
  end_date,
  assigned_developer_id,
  created_at,
  updated_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;
```

## 🔧 Manual Test

### Test 1: Manual Insert
Try inserting a task manually via Supabase SQL Editor:
```sql
INSERT INTO tasks (
  id,
  title,
  project,
  jira_url,
  hours,
  start_date,
  end_date,
  assigned_developer_id
) VALUES (
  'TEST-001',
  'Test Task',
  'Test Project',
  'https://jira.example.com/TEST-001',
  40,
  '2026-01-05',
  '2026-01-12',
  NULL
);
```

If this works, the database is fine and the issue is in the app code.

### Test 2: Manual Update
Try updating a task:
```sql
UPDATE tasks
SET title = 'Updated Title',
    updated_at = NOW()
WHERE id = 'TEST-001';
```

### Test 3: Check RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tasks';
```

You should see a policy that allows all operations.

## 🎯 Expected Behavior

### On App Load
1. App initializes
2. Checks if Supabase is configured
3. If yes, fetches data from Supabase
4. If no data, uses sample data
5. Saves sample data to Supabase (first time only)

### On Task Creation
1. User clicks "Add Task"
2. Fills in form
3. Clicks "Create Task"
4. State updates immediately (UI reflects change)
5. useEffect triggers
6. `saveAppState` is called
7. Tasks are saved to Supabase
8. Console shows success logs

### On Task Edit
1. User clicks "Edit" on a task
2. Modifies fields
3. Clicks "Update Task"
4. State updates immediately
5. useEffect triggers
6. `saveAppState` is called
7. Tasks are updated in Supabase
8. Console shows success logs

### On Task Delete
1. User clicks "Delete" on a task
2. Confirmation modal appears
3. User confirms
4. Task is removed from state
5. useEffect triggers
6. `saveAppState` is called
7. Task is deleted from Supabase
8. Console shows success logs

## 📝 Console Log Reference

### Initialization Logs
- `🚀 Initializing app...` - App is starting
- `📡 Supabase is configured` - Supabase credentials found
- `⚠️ Supabase not configured` - Missing credentials
- `📦 Loading sample data...` - Using sample data

### Fetch Logs
- `📡 Fetching app state from Supabase...` - Starting fetch
- `📡 Fetching developers...` - Fetching developers table
- `📡 Fetching tasks...` - Fetching tasks table
- `📡 Fetching settings...` - Fetching settings table
- `✅ Fetched X developers` - Success
- `✅ Fetched X tasks` - Success
- `❌ Error fetching...` - Failed

### Save Logs
- `🔄 State changed, saving to Supabase...` - State changed, triggering save
- `💾 Attempting to save app state...` - Starting save
- `🔄 Saving developers...` - Saving developers
- `🔄 Saving tasks...` - Saving tasks
- `💾 Saving tasks to Supabase... X tasks` - Task save started
- `📊 Existing tasks: X Current tasks: X` - Comparing existing vs current
- `🗑️ Deleting X removed tasks` - Deleting tasks
- `✅ Tasks saved successfully - Inserted: X Updated: X` - Success
- `❌ Error saving...` - Failed

## 🚨 Critical Checks

### 1. Environment Variables
```bash
# Check if .env exists
ls -la .env

# Check contents
cat .env
```

Should show:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Supabase Connection
```javascript
// In browser console
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log('URL:', url);
console.log('Key:', key ? 'Set' : 'Not set');
```

### 3. Database Schema
Check that all required tables and columns exist:
- `developers` table
- `tasks` table
- `settings` table
- All required columns (see SQL schema)

### 4. RLS Policies
Check that RLS policies allow operations:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('developers', 'tasks', 'settings');
```

## 📞 Next Steps

1. **Deploy the updated code** with logging
2. **Open browser console** and watch logs
3. **Try creating/editing/deleting tasks**
4. **Share the console logs** if issues persist
5. **Check Supabase dashboard** to verify data

## 🎉 Success Indicators

You'll know it's working when you see:
- ✅ All fetch logs show success
- ✅ All save logs show success
- ✅ Data appears in Supabase Table Editor
- ✅ Data persists after page refresh
- ✅ No error messages in console

---

**Status:** 🔍 Debugging logs added  
**Next Step:** Deploy and check console logs  
**Expected Result:** Clear visibility into save process
