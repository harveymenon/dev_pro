# Gantt Chart Planner - Supabase Setup Guide

This guide will help you set up Supabase for the Gantt Chart Planner application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the project details:
   - Name: `gantt-chart-planner` (or your preferred name)
   - Database Password: (choose a secure password)
   - Region: (choose the closest to your users)
4. Click "Create new project"

## Step 2: Create Database Tables

Once your project is created, go to the SQL Editor and run the following SQL to create the required tables:

```sql
-- Create developers table
CREATE TABLE developers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hours INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_developer_id ON tasks(developer_id);
CREATE INDEX idx_tasks_start_date ON tasks(start_date);
CREATE INDEX idx_tasks_end_date ON tasks(end_date);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for simplicity)
-- In production, you may want to add authentication
CREATE POLICY "Enable all operations for developers" ON developers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for settings" ON settings FOR ALL USING (true) WITH CHECK (true);
```

## Step 3: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API"
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (a long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

Create a `.env` file in the root of your project with the following content:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase credentials.

**Important:** Never commit your `.env` file to version control. Make sure it's in your `.gitignore` file.

## Step 5: Install Dependencies

If you haven't already, install the required dependencies:

```bash
npm install
```

## Step 6: Run the Application

Start the development server:

```bash
npm run dev
```

The application will now:
- Load data from Supabase on startup
- Save all changes automatically to Supabase
- Persist data across browser sessions
- Sync data across multiple devices/browsers

## Database Schema Explanation

### developers table
- `id`: Unique identifier for each developer (e.g., "DEV-001")
- `name`: Developer's name
- `color`: Hex color code for the developer's Gantt bars
- `created_at`: Timestamp when the developer was created
- `updated_at`: Timestamp when the developer was last updated

### tasks table
- `id`: Unique identifier for each task (e.g., "TASK-001")
- `developer_id`: Foreign key referencing the developer who owns this task
- `title`: Task title/description
- `hours`: Number of hours needed to complete the task
- `start_date`: Task start date (ISO format)
- `end_date`: Task end date (calculated automatically)
- `created_at`: Timestamp when the task was created
- `updated_at`: Timestamp when the task was last updated

### settings table
- `key`: Setting name (e.g., "working_hours_per_day", "active_tab")
- `value`: Setting value (stored as string)
- `updated_at`: Timestamp when the setting was last updated

## Features with Supabase

✅ **Persistent Storage**: All data is stored in Supabase and persists across sessions
✅ **Multi-device Sync**: Access your data from any device
✅ **Real-time Updates**: Changes are immediately saved to the database
✅ **No LocalStorage Dependency**: Data is not tied to a specific browser
✅ **Scalable**: Can handle large datasets efficiently

## Troubleshooting

### Data not loading
- Check that your `.env` file has the correct Supabase URL and anon key
- Verify that the database tables have been created
- Check the browser console for any error messages

### Data not saving
- Ensure Row Level Security policies are configured correctly
- Check that your Supabase project is active and not paused
- Verify network connectivity to Supabase

### Connection errors
- Double-check your Supabase URL format (should start with `https://`)
- Ensure the anon key is complete and correctly formatted
- Check if your Supabase project is paused (free tier projects pause after inactivity)

## Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform:
   - Vercel: Add environment variables in project settings
   - Netlify: Add environment variables in site settings
   - Other platforms: Use their respective environment variable management

2. Consider adding authentication:
   - Supabase provides built-in authentication
   - Update Row Level Security policies to require authentication
   - Add login/signup functionality to the app

3. Enable database backups:
   - Supabase provides automatic backups
   - Consider additional backup strategies for critical data

## Security Considerations

The current setup uses open Row Level Security policies for simplicity. For production use:

1. **Add Authentication**: Implement user authentication using Supabase Auth
2. **Update RLS Policies**: Restrict access to authenticated users only
3. **User-specific Data**: Consider adding a `user_id` column to associate data with specific users
4. **API Rate Limiting**: Monitor and limit API usage to prevent abuse

## Support

For issues or questions:
- Check the Supabase documentation: https://supabase.com/docs
- Review the application code in `src/utils/supabaseClient.ts` and `src/utils/storageUtils.ts`
- Check browser console for detailed error messages
