-- Fix developer_id foreign key constraint to allow NULL values
-- This is required for unassigning tasks (moving them to backlog)

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_developer_id_fkey;

-- Step 2: Make developer_id column nullable
ALTER TABLE tasks ALTER COLUMN developer_id DROP NOT NULL;

-- Step 3: Update any existing empty strings to NULL
UPDATE tasks SET developer_id = NULL WHERE developer_id = '';

-- Step 4: Re-add the foreign key constraint (now allowing NULL)
ALTER TABLE tasks 
ADD CONSTRAINT tasks_developer_id_fkey 
FOREIGN KEY (developer_id) 
REFERENCES developers(id) 
ON DELETE SET NULL;

-- Step 5: Verify the changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'tasks' 
AND column_name = 'developer_id';

-- Step 6: Verify foreign key constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'tasks'
AND kcu.column_name = 'developer_id';

SELECT '✅ developer_id column now allows NULL values and has proper foreign key constraint!' as status;
