-- Add sort_order column to tasks table for drag-and-drop ordering
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);

-- Update existing tasks to have a default sort order based on created_at
UPDATE tasks 
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM tasks
) as subquery
WHERE tasks.id = subquery.id
AND tasks.sort_order IS NULL;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' 
AND column_name = 'sort_order';

SELECT '✅ sort_order column added successfully!' as status;
