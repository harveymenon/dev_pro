# 📋 Backlog Management Implementation Guide

## Overview

This guide provides a complete implementation plan for adding Backlog Management and Developer Task Assignment features to your Gantt Chart Planner application.

## 🎯 Key Architectural Changes

### 1. Centralized Task Storage

**Current Architecture:**
```typescript
Developer {
  id: string;
  name: string;
  color: string;
  tasks: Task[];  // Tasks stored per developer
}
```

**New Architecture:**
```typescript
AppState {
  developers: Developer[];  // Just developer info
  tasks: Task[];            // All tasks in one place
  projects: string[];       // Project list
  workingHoursPerDay: number;
}

Task {
  id: string;
  title: string;
  project: string;          // NEW
  jiraUrl: string;          // NEW
  hours: number;
  startDate: string;
  endDate: string;
  assignedDeveloperId: string | null;  // NEW - null = backlog
}

Developer {
  id: string;
  name: string;
  color: string;
  // No tasks array - tasks are filtered by assignedDeveloperId
}
```

### 2. Data Flow

```
All Tasks (Centralized)
    ↓
    ├─→ Filter by assignedDeveloperId === null → BACKLOG
    │
    ├─→ Filter by assignedDeveloperId === 'DEV-001' → ROBB
    │
    ├─→ Filter by assignedDeveloperId === 'DEV-002' → JOHN
    │
    └─→ Filter by assignedDeveloperId !== null → OVERVIEW (Gantt)
```

## 📝 Implementation Steps

### Step 1: Update Types (✅ Partially Done)

File: `src/types.ts`

```typescript
export interface Task {
  id: string;
  title: string;
  project: string;           // NEW
  jiraUrl: string;           // NEW
  hours: number;
  startDate: string;
  endDate: string;
  assignedDeveloperId: string | null;  // NEW
}

export interface Developer {
  id: string;
  name: string;
  color: string;
  // Remove tasks array
}

export interface AppState {
  workingHoursPerDay: number;
  developers: Developer[];
  tasks: Task[];
  projects: string[];
}
```

### Step 2: Update Utility Functions (✅ Partially Done)

File: `src/utils/developerUtils.ts`

Key functions to implement:

```typescript
// Get backlog tasks
export function getBacklogTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.assignedDeveloperId === null);
}

// Get developer tasks
export function getDeveloperTasks(tasks: Task[], developerId: string): Task[] {
  return tasks.filter(task => task.assignedDeveloperId === developerId);
}

// Assign task
export function assignTask(tasks: Task[], taskId: string, developerId: string): Task[] {
  return tasks.map(task =>
    task.id === taskId ? { ...task, assignedDeveloperId: developerId } : task
  );
}

// Unassign task
export function unassignTask(tasks: Task[], taskId: string): Task[] {
  return tasks.map(task =>
    task.id === taskId ? { ...task, assignedDeveloperId: null } : task
  );
}

// Create task
export function createTask(
  tasks: Task[],
  taskData: Omit<Task, 'endDate'>,
  workingHoursPerDay: number
): Task[] {
  const startDate = parseDate(taskData.startDate);
  const endDate = calculateEndDate(startDate, taskData.hours, workingHoursPerDay);
  return [...tasks, { ...taskData, endDate: formatDateISO(endDate) }];
}
```

### Step 3: Update Storage Utils (✅ Partially Done)

File: `src/utils/storageUtils.ts`

```typescript
export async function fetchAppState(): Promise<AppState | null> {
  // Fetch developers, tasks, and settings separately
  // Return combined AppState
}

export async function saveAppState(appState: AppState): Promise<void> {
  // Save developers, tasks, and settings separately
}
```

### Step 4: Update Supabase Schema

File: `supabase-schema.sql`

```sql
-- Update tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS jira_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_developer_id TEXT REFERENCES developers(id);

-- Update developers table (remove tasks relationship)
-- Tasks are now linked via assigned_developer_id

-- Create projects table (optional)
CREATE TABLE IF NOT EXISTS projects (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Step 5: Update App Component

File: `src/App.tsx`

Key changes:

```typescript
// State
const [developers, setDevelopers] = useState<Developer[]>([]);
const [tasks, setTasks] = useState<Task[]>([]);
const [projects, setProjects] = useState<string[]>(DEFAULT_PROJECTS);

// Computed values
const backlogTasks = useMemo(() => getBacklogTasks(tasks), [tasks]);
const activeDeveloperTasks = useMemo(() => {
  if (activeTab === 'overview' || activeTab === 'backlog') return [];
  return getDeveloperTasks(tasks, activeTab);
}, [tasks, activeTab]);

// Add task handler
const handleAddTask = (taskData: Omit<Task, 'endDate'>) => {
  setTasks(prev => createTask(prev, taskData, workingHoursPerDay));
};

// Assign task handler
const handleAssignTask = (taskId: string, developerId: string) => {
  setTasks(prev => assignTask(prev, taskId, developerId));
};

// Unassign task handler
const handleUnassignTask = (taskId: string) => {
  setTasks(prev => unassignTask(prev, taskId));
};
```

### Step 6: Add Backlog Tab UI

```typescript
{activeTab === 'backlog' && (
  <>
    {/* Summary cards */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      <SummaryCard title="Backlog Tasks" value={backlogSummary.totalTasks} />
      <SummaryCard title="Backlog Hours" value={backlogSummary.totalHours} />
      <SummaryCard title="Projects" value={backlogSummary.totalProjects} />
    </div>
    
    {/* Add task button */}
    <button onClick={() => handleOpenAddTask()}>+ Add New Task</button>
    
    {/* Task table */}
    <TaskTable tasks={backlogTasks} showAssignButton={true} />
  </>
)}
```

### Step 7: Add Task Creation Modal

```typescript
const TaskModal = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: task?.id || getNextTaskId(tasks),
    title: task?.title || '',
    project: task?.project || '',
    jiraUrl: task?.jiraUrl || '',
    hours: task?.hours || 40,
    startDate: task?.startDate || '2026-01-05',
    assignedDeveloperId: task?.assignedDeveloperId || null,
  });

  return (
    <Modal>
      <input placeholder="Task ID" value={formData.id} />
      <input placeholder="Task Title" value={formData.title} />
      <select value={formData.project}>
        {projects.map(p => <option key={p}>{p}</option>)}
      </select>
      <input placeholder="Jira URL" value={formData.jiraUrl} />
      <input type="number" value={formData.hours} />
      <input type="date" value={formData.startDate} />
      <select value={formData.assignedDeveloperId || ''}>
        <option value="">Backlog (Unassigned)</option>
        {developers.map(dev => (
          <option key={dev.id} value={dev.id}>{dev.name}</option>
        ))}
      </select>
      <button onClick={() => onSave(formData)}>Save</button>
    </Modal>
  );
};
```

### Step 8: Add Assignment Modal

```typescript
const AssignModal = ({ taskId, onAssign, onCancel }) => {
  const [selectedDeveloper, setSelectedDeveloper] = useState('');

  return (
    <Modal>
      <select value={selectedDeveloper} onChange={e => setSelectedDeveloper(e.target.value)}>
        <option value="">Select Developer</option>
        {developers.map(dev => (
          <option key={dev.id} value={dev.id}>{dev.name}</option>
        ))}
      </select>
      <button onClick={() => onAssign(taskId, selectedDeveloper)}>Assign</button>
    </Modal>
  );
};
```

### Step 9: Update Task Table

```typescript
const TaskTable = ({ tasks, showAssignButton }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Task ID</th>
          <th>Title</th>
          <th>Project</th>
          <th>Jira</th>
          <th>Hours</th>
          <th>Start</th>
          <th>End</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => (
          <tr key={task.id}>
            <td>{task.id}</td>
            <td>{task.title}</td>
            <td>{task.project}</td>
            <td>
              {task.jiraUrl ? (
                <a href={task.jiraUrl} target="_blank">
                  {extractJiraTicketId(task.jiraUrl)} ↗
                </a>
              ) : '—'}
            </td>
            <td>{task.hours}h</td>
            <td>{formatDate(parseDate(task.startDate))}</td>
            <td>{formatDate(parseDate(task.endDate))}</td>
            <td>
              {showAssignButton ? (
                <button onClick={() => handleOpenAssignModal(task.id)}>Assign</button>
              ) : (
                <>
                  <button onClick={() => handleOpenEditModal(task)}>Edit</button>
                  {task.assignedDeveloperId && (
                    <button onClick={() => handleUnassignTask(task.id)}>Unassign</button>
                  )}
                  <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Step 10: Update Excel Export

File: `src/utils/excelUtils.ts`

```typescript
export function exportAllDevelopersToExcel(
  developers: Developer[],
  tasks: Task[],
  projects: string[],
  workingHoursPerDay: number
): void {
  const wb = XLSX.utils.book_new();

  // Project Summary sheet
  const projectSummary = calculateProjectSummary(developers, tasks, workingHoursPerDay);
  const summarySheet = createProjectSummarySheet(projectSummary);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Project Summary');

  // Backlog sheet
  const backlogTasks = getBacklogTasks(tasks);
  const backlogSheet = createBacklogSheet(backlogTasks);
  XLSX.utils.book_append_sheet(wb, backlogSheet, 'Backlog');

  // Consolidated Gantt sheet
  const consolidatedSheet = createConsolidatedGanttSheet(tasks, developers);
  XLSX.utils.book_append_sheet(wb, consolidatedSheet, 'Consolidated Gantt');

  // Individual developer sheets
  developers.forEach(dev => {
    const devTasks = getDeveloperTasks(tasks, dev.id);
    const devSheet = createDeveloperSheet(dev, devTasks);
    XLSX.utils.book_append_sheet(wb, devSheet, dev.name);
  });

  XLSX.writeFile(wb, 'Project_Gantt_All_Developers.xlsx');
}
```

## 🔄 Migration Strategy

### Phase 1: Database Migration
1. Run SQL to add new columns to tasks table
2. Migrate existing tasks to include project and jiraUrl fields
3. Set assignedDeveloperId based on current developer-task relationships

### Phase 2: Code Migration
1. Update types
2. Update utility functions
3. Update storage functions
4. Update App component
5. Test each feature incrementally

### Phase 3: UI Migration
1. Add Backlog tab
2. Update task creation modal
3. Add assignment modal
4. Update task tables
5. Update Gantt chart

## ✅ Testing Checklist

- [ ] Create task without developer (goes to backlog)
- [ ] Create task with developer (assigned directly)
- [ ] Assign backlog task to developer
- [ ] Unassign developer task (returns to backlog)
- [ ] Reassign task between developers
- [ ] Edit task from backlog
- [ ] Edit task from developer tab
- [ ] Delete task from backlog
- [ ] Delete task from developer tab
- [ ] Backlog summary updates correctly
- [ ] Developer summary updates correctly
- [ ] Overview shows only assigned tasks
- [ ] Gantt chart updates after assignment
- [ ] Excel export includes backlog sheet
- [ ] Excel export includes project and jira fields
- [ ] Data persists to Supabase
- [ ] Data loads from Supabase

## 📊 Data Migration Script

```sql
-- Add new columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS jira_url TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_developer_id TEXT;

-- Migrate existing data (assuming tasks are currently linked via a join table)
-- This depends on your current schema

-- Update RLS policies
DROP POLICY IF EXISTS "Enable all operations for tasks" ON tasks;
CREATE POLICY "Enable all operations for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
```

## 🎯 Key Benefits

1. **Single Source of Truth**: Tasks stored centrally, not duplicated
2. **Flexible Assignment**: Tasks can move between backlog and developers
3. **Better Organization**: Project and Jira tracking
4. **Improved Workflow**: BA/PM can manage backlog separately
5. **Better Reporting**: Clear distinction between assigned and unassigned work

## 🚀 Next Steps

1. Review this implementation guide
2. Decide on migration approach (incremental vs. complete rewrite)
3. Create a backup of current data
4. Implement changes in phases
5. Test thoroughly after each phase
6. Deploy to production

## 📞 Support

If you need help implementing any part of this guide, refer to:
- `src/types.ts` - Type definitions
- `src/utils/developerUtils.ts` - Utility functions
- `src/utils/storageUtils.ts` - Storage functions
- `src/App.tsx` - Main component
- `supabase-schema.sql` - Database schema

---

**Status:** 📋 Implementation Guide Complete  
**Next Step:** Begin phased implementation  
**Estimated Time:** 4-6 hours for complete implementation
