ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS jira_url TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_developer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_developer_id ON tasks(assigned_developer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project);

UPDATE tasks SET assigned_developer_id = developer_id WHERE developer_id IS NOT NULL AND assigned_developer_id IS NULL;
UPDATE tasks SET project = 'Unspecified' WHERE project IS NULL OR project = '';

DROP POLICY IF EXISTS "Enable all operations for tasks" ON tasks;
DROP POLICY IF EXISTS "Enable all operations for developers" ON developers;
DROP POLICY IF EXISTS "Enable all operations for settings" ON settings;

CREATE POLICY "Enable all operations for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for developers" ON developers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO settings (key, value, updated_at) VALUES ('projects', '["Tres Health","Shopmool","Hamsarjo","ZeusIP","Other"]', NOW()) ON CONFLICT (key) DO UPDATE SET value = '["Tres Health","Shopmool","Hamsarjo","ZeusIP","Other"]', updated_at = NOW();

SELECT 'Schema update completed successfully!' as status;
