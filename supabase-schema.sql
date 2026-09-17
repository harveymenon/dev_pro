-- Gantt Chart Planner Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create developers table
CREATE TABLE IF NOT EXISTS developers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
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
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_developer_id ON tasks(developer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);

-- Enable Row Level Security
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development)
-- In production, add authentication and restrict access
DROP POLICY IF EXISTS "Enable all operations for developers" ON developers;
DROP POLICY IF EXISTS "Enable all operations for tasks" ON tasks;
DROP POLICY IF EXISTS "Enable all operations for settings" ON settings;

CREATE POLICY "Enable all operations for developers" ON developers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO settings (key, value) VALUES ('working_hours_per_day', '8')
ON CONFLICT (key) DO NOTHING;

-- Optional: Insert sample data
-- Uncomment the following lines if you want to start with sample data

/*
INSERT INTO developers (id, name, color) VALUES
  ('DEV-001', 'Robb', '#4F46E5'),
  ('DEV-002', 'John', '#0891B2'),
  ('DEV-003', 'Sarah', '#16A34A');

INSERT INTO tasks (id, developer_id, title, hours, start_date, end_date) VALUES
  ('TASK-001', 'DEV-001', 'Requirements Analysis', 40, '2026-01-05', '2026-01-09'),
  ('TASK-002', 'DEV-001', 'UI Development', 120, '2026-01-12', '2026-01-30'),
  ('TASK-003', 'DEV-002', 'Backend Development', 160, '2026-02-02', '2026-02-27'),
  ('TASK-004', 'DEV-002', 'API Integration', 80, '2026-02-23', '2026-03-06'),
  ('TASK-005', 'DEV-003', 'QA Testing', 80, '2026-03-02', '2026-03-13'),
  ('TASK-006', 'DEV-003', 'Regression Testing', 40, '2026-03-16', '2026-03-20');
*/
