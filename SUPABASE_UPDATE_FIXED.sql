-- ============================================
-- SUPABASE SCHEMA UPDATE - CORRECTED VERSION
-- ============================================
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================

-- 1. ADD NEW COLUMNS TO TASKS TABLE
-- ============================================

-- Add project field
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project TEXT DEFAULT '';

-- Add Jira URL field
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS jira_url TEXT DEFAULT '';

-- Add assigned_developer_id for backlog management
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_developer_id TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_developer_id 
ON tasks(assigned_developer_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project 
ON tasks(project);

-- 2. MIGRATE EXISTING DATA
-- ============================================

-- Copy developer_id to assigned_developer_id for existing tasks
UPDATE tasks 
SET assigned_developer_id = developer_id 
WHERE developer_id IS NOT NULL 
  AND assigned_developer_id IS NULL;

-- Set default project for existing tasks if empty
UPDATE tasks 
SET project = 'Unspecified' 
WHERE project IS NULL OR project = '';

-- 3. UPDATE SECURITY POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for tasks" ON tasks;
DROP POLICY IF EXISTS "Enable all operations for developers" ON developers;
DROP POLICY IF EXISTS "Enable all operations for settings" ON settings;

-- Create new policies
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

-- 5. VERIFICATION QUERIES
-- ============================================

-- Check tasks table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- Check migrated data sample
SELECT 
  id,
  title,
  project,
  jira_url,
  hours,
  start_date,
  end_date,
  CASE 
    WHEN assigned_developer_id IS NULL THEN 'BACKLOG'
    ELSE 'ASSIGNED'
  END as status
FROM tasks 
ORDER BY created_at DESC
LIMIT 5;

-- Summary statistics
SELECT 
  'Tasks' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN assigned_developer_id IS NULL THEN 1 END) as backlog_tasks,
  COUNT(CASE WHEN assigned_developer_id IS NOT NULL THEN 1 END) as assigned_tasks
FROM tasks;

-- Success message
SELECT '✅ Schema update completed successfully!' as status;
