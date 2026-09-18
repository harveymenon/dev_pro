-- ============================================
-- SUPABASE SCHEMA UPDATE FOR BACKLOG MANAGEMENT
-- AND MANUAL END DATE ENTRY
-- ============================================
-- Run this in Supabase SQL Editor
-- This script is idempotent - safe to run multiple times
-- ============================================

-- 1. ADD NEW COLUMNS TO TASKS TABLE
-- ============================================

-- Add project field
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project TEXT DEFAULT '';

-- Add Jira URL field
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS jira_url TEXT DEFAULT '';

-- Add assigned_developer_id for backlog management
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_developer_id TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_developer_id 
ON tasks(assigned_developer_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project 
ON tasks(project);

-- 2. MIGRATE EXISTING DATA
-- ============================================

-- Copy developer_id to assigned_developer_id for existing tasks
-- This maintains backward compatibility
UPDATE tasks 
SET assigned_developer_id = developer_id 
WHERE developer_id IS NOT NULL 
  AND assigned_developer_id IS NULL;

-- Set default project for existing tasks if empty
UPDATE tasks 
SET project = 'Unspecified' 
WHERE project IS NULL OR project = '';

-- 3. UPDATE ROW LEVEL SECURITY POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for tasks" ON tasks;
DROP POLICY IF EXISTS "Enable all operations for developers" ON developers;
DROP POLICY IF EXISTS "Enable all operations for settings" ON settings;

-- Create new policies that allow all operations (for development)
CREATE POLICY "Enable all operations for tasks" 
ON tasks FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all operations for developers" 
ON developers FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all operations for settings" 
ON settings FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. ADD DEFAULT PROJECTS TO SETTINGS
-- ============================================

INSERT INTO settings (key, value, updated_at) 
VALUES (
  'projects', 
  '["Tres Health","Shopmool","Hamsarjo","ZeusIP","Other"]',
  NOW()
)
ON CONFLICT (key) DO UPDATE 
SET value = '["Tres Health","Shopmool","Hamsarjo","ZeusIP","Other"]',
    updated_at = NOW();

-- 5. VERIFY CHANGES
-- ============================================

-- Check tasks table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- Check migrated data
SELECT 
  id,
  title,
  project,
  jira_url,
  hours,
  start_date,
  end_date,
  developer_id,
  assigned_developer_id,
  CASE 
    WHEN assigned_developer_id IS NULL THEN 'BACKLOG'
    ELSE 'ASSIGNED'
  END as status
FROM tasks 
ORDER BY created_at DESC
LIMIT 10;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tasks'
ORDER BY indexname;

-- Check settings
SELECT 
  key,
  value,
  updated_at
FROM settings
ORDER BY key;

-- 6. SUMMARY
-- ============================================

SELECT 
  'Tasks' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN assigned_developer_id IS NULL THEN 1 END) as backlog_tasks,
  COUNT(CASE WHEN assigned_developer_id IS NOT NULL THEN 1 END) as assigned_tasks
FROM tasks
UNION ALL
SELECT 
  'Developers' as table_name,
  COUNT(*) as total_records,
  NULL as backlog_tasks,
  NULL as assigned_tasks
FROM developers;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ Schema update completed successfully!' as status;
