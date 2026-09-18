-- Fix the developer_id NOT NULL constraint issue
-- This allows tasks to exist without a developer (backlog tasks)

-- Option 1: Make developer_id nullable (recommended)
ALTER TABLE tasks ALTER COLUMN developer_id DROP NOT NULL;

-- Option 2: Or set a default value
-- ALTER TABLE tasks ALTER COLUMN developer_id SET DEFAULT '';

-- Update existing tasks with empty developer_id to NULL
UPDATE tasks SET developer_id = NULL WHERE developer_id = '';

-- Verify the change
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'developer_id';

SELECT '✅ developer_id column is now nullable!' as status;
