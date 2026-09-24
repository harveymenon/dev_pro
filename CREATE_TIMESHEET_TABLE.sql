-- Create timesheet_entries table
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  task_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  hours_spent DECIMAL(5,2) NOT NULL CHECK (hours_spent >= 0),
  portal TEXT,
  environment TEXT CHECK (environment IN ('DEV', 'UAT', 'PROD', 'Other')),
  description TEXT,
  developer_id TEXT NOT NULL,
  developer_name TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_date ON timesheet_entries(date);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_developer_id ON timesheet_entries(developer_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_task_id ON timesheet_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_week ON timesheet_entries(year, week_number);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_portal ON timesheet_entries(portal);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_environment ON timesheet_entries(environment);

-- Enable Row Level Security
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development)
-- In production, you may want to add authentication
DROP POLICY IF EXISTS "Enable all operations for timesheet_entries" ON timesheet_entries;
CREATE POLICY "Enable all operations for timesheet_entries" 
ON timesheet_entries 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add standard_weekly_hours setting
INSERT INTO settings (key, value, updated_at) 
VALUES ('standard_weekly_hours', '40', NOW())
ON CONFLICT (key) DO UPDATE 
SET value = '40', updated_at = NOW();

-- Verify the table was created
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'timesheet_entries';

-- Verify columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'timesheet_entries'
ORDER BY ordinal_position;

SELECT '✅ timesheet_entries table created successfully!' as status;
