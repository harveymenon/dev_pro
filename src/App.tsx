import { useState, useMemo, useCallback, useEffect } from 'react';
import { Developer, Task, ProcessedTask, MonthColumn, AppState } from './types';
import {
  calculateEndDate,
  generateMonthsBetween,
  calculateTimelineRange,
  formatDate,
  formatDateISO,
  parseDate,
  getDaysInMonth,
} from './utils/dateUtils';
import {
  DEVELOPER_COLORS,
  DEFAULT_PROJECTS,
  getNextDeveloperId,
  getNextTaskId,
  isTaskIdUnique,
  getNextDeveloperColor,
  addDeveloper,
  editDeveloperName,
  deleteDeveloper,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
  recalculateAllEndDates,
  getProcessedTasks,
  getBacklogTasks,
  getDeveloperTasks,
  calculateBacklogSummary,
  calculateDeveloperSummary,
  calculateProjectSummary,
  getDeveloperById,
  validateJiraUrl,
  extractJiraTicketId,
} from './utils/developerUtils';
import {
  saveAppState,
  fetchAppState,
  isSupabaseConfigured,
} from './utils/storageUtils';
import {
  exportDeveloperToExcel,
  exportAllDevelopersToExcel,
} from './utils/excelUtils';
import ImportModal from './components/ImportModal';

// Sample data
const SAMPLE_DEVELOPERS: Developer[] = [
  { id: 'DEV-001', name: 'Robb', color: DEVELOPER_COLORS[0] },
  { id: 'DEV-002', name: 'John', color: DEVELOPER_COLORS[1] },
  { id: 'DEV-003', name: 'Sarah', color: DEVELOPER_COLORS[2] },
];

const SAMPLE_TASKS: Task[] = [
  {
    id: 'TASK-001',
    title: 'Requirements Analysis',
    project: 'Tres Health',
    jiraUrl: 'https://jira.company.com/browse/TH-101',
    hours: 40,
    startDate: '2026-01-05',
    endDate: '',
    assignedDeveloperId: 'DEV-001',
  },
  {
    id: 'TASK-002',
    title: 'UI Development',
    project: 'Tres Health',
    jiraUrl: 'https://jira.company.com/browse/TH-102',
    hours: 120,
    startDate: '2026-01-12',
    endDate: '',
    assignedDeveloperId: 'DEV-001',
  },
  {
    id: 'TASK-003',
    title: 'Backend Development',
    project: 'Tres Health',
    jiraUrl: 'https://jira.company.com/browse/TH-103',
    hours: 160,
    startDate: '2026-02-02',
    endDate: '',
    assignedDeveloperId: 'DEV-002',
  },
  {
    id: 'TASK-004',
    title: 'API Integration',
    project: 'Tres Health',
    jiraUrl: 'https://jira.company.com/browse/TH-104',
    hours: 80,
    startDate: '2026-02-23',
    endDate: '',
    assignedDeveloperId: 'DEV-002',
  },
  {
    id: 'TASK-005',
    title: 'QA Testing',
    project: 'Tres Health',
    jiraUrl: 'https://jira.company.com/browse/TH-105',
    hours: 80,
    startDate: '2026-03-02',
    endDate: '',
    assignedDeveloperId: 'DEV-003',
  },
  {
    id: 'TASK-006',
    title: 'Regression Testing',
    project: 'Tres Health',
    jiraUrl: 'https://jira.company.com/browse/TH-106',
    hours: 40,
    startDate: '2026-03-16',
    endDate: '',
    assignedDeveloperId: 'DEV-003',
  },
  {
    id: 'TASK-007',
    title: 'Claims Export',
    project: 'Tres Health',
    jiraUrl: 'https://jira.company.com/browse/TH-123',
    hours: 40,
    startDate: '2026-03-16',
    endDate: '',
    assignedDeveloperId: null, // Backlog
  },
];

export default function App() {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // App state
  const [developers, setDevelopers] = useState<Developer[]>(SAMPLE_DEVELOPERS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<string[]>(DEFAULT_PROJECTS);
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState<number>(8);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Initialize state with sample data or load from Supabase
  useEffect(() => {
    const initSampleData = async () => {
      console.log('🚀 Initializing app...');
      
      // Try to load from Supabase first
      if (isSupabaseConfigured()) {
        console.log('📡 Supabase is configured, attempting to load data...');
        try {
          const appState = await fetchAppState();
          if (appState && (appState.developers.length > 0 || appState.tasks.length > 0)) {
            console.log('✅ Loaded data from Supabase:', {
              developers: appState.developers.length,
              tasks: appState.tasks.length,
              projects: appState.projects.length
            });
            setDevelopers(appState.developers);
            setTasks(appState.tasks);
            setProjects(appState.projects.length > 0 ? appState.projects : DEFAULT_PROJECTS);
            setWorkingHoursPerDay(appState.workingHoursPerDay);
            setIsLoading(false);
            return;
          } else {
            console.log('⚠️ Supabase is empty or returned no data, using sample data');
          }
        } catch (error) {
          console.error('❌ Error loading from Supabase:', error);
        }
      } else {
        console.log('⚠️ Supabase not configured, using sample data');
      }

      // Use sample data if Supabase is not configured or has no data
      console.log('📦 Loading sample data...');
      const tasksWithEndDates = SAMPLE_TASKS.map(task => {
        const start = parseDate(task.startDate);
        const end = calculateEndDate(start, task.hours, 8);
        return { ...task, endDate: formatDateISO(end) };
      });
      setTasks(tasksWithEndDates);
      setIsLoading(false);
    };

    initSampleData();
  }, []);

  // Save to Supabase whenever state changes
  useEffect(() => {
    if (!isLoading && isSupabaseConfigured()) {
      console.log('🔄 State changed, saving to Supabase...', {
        developers: developers.length,
        tasks: tasks.length,
        projects: projects.length,
        workingHoursPerDay
      });
      
      // Log the first task's dates to track state changes
      if (tasks.length > 0) {
        console.log('📊 Current tasks state - first task:', {
          id: tasks[0].id,
          startDate: tasks[0].startDate,
          endDate: tasks[0].endDate
        });
      }
      
      const appState: AppState = {
        workingHoursPerDay,
        developers,
        tasks,
        projects,
      };
      saveAppState(appState);
    }
  }, [developers, tasks, projects, workingHoursPerDay, isLoading]);

  // Recalculate end dates when working hours change
  useEffect(() => {
    if (!isLoading) {
      setTasks(prev => recalculateAllEndDates(prev, workingHoursPerDay));
    }
  }, [workingHoursPerDay, isLoading]);

  // Modal states
  const [showAddDeveloper, setShowAddDeveloper] = useState(false);
  const [newDeveloperName, setNewDeveloperName] = useState('');
  const [editingDeveloperId, setEditingDeveloperId] = useState<string | null>(null);
  const [editingDeveloperName, setEditingDeveloperName] = useState('');
  const [deleteDeveloperConfirm, setDeleteDeveloperConfirm] = useState<string | null>(null);

  // Task modal states
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    id: '',
    title: '',
    project: '',
    jiraUrl: '',
    hours: 40,
    startDate: '2026-01-05',
    endDate: '2026-01-12',
    assignedDeveloperId: null as string | null,
  });
  const [taskIdError, setTaskIdError] = useState('');
  const [jiraUrlError, setJiraUrlError] = useState('');

  // Assignment modal
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [assigningToDeveloper, setAssigningToDeveloper] = useState<string>('');

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    task: ProcessedTask;
    x: number;
    y: number;
  } | null>(null);

  // Delete task confirmation
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<string | null>(null);

  // Get processed tasks
  const processedTasks = useMemo(() => {
    console.log('🔄 processedTasks recalculating with', tasks.length, 'tasks');
    if (tasks.length > 0) {
      console.log('📋 First task dates:', {
        id: tasks[0].id,
        startDate: tasks[0].startDate,
        endDate: tasks[0].endDate
      });
    }
    return getProcessedTasks(tasks, developers, workingHoursPerDay);
  }, [tasks, developers, workingHoursPerDay]);

  // Get backlog tasks
  const backlogTasks = useMemo(() => {
    return getBacklogTasks(processedTasks);
  }, [processedTasks]);

  // Get tasks for active developer
  const activeDeveloperTasks = useMemo(() => {
    if (activeTab === 'overview' || activeTab === 'backlog') return [];
    return getDeveloperTasks(processedTasks, activeTab);
  }, [processedTasks, activeTab]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const tasksToShow = activeTab === 'overview' 
      ? processedTasks.filter(t => t.assignedDeveloperId !== null)
      : activeTab === 'backlog'
      ? backlogTasks
      : activeDeveloperTasks;

    const dateTasks = tasksToShow.map(t => ({
      startDate: t.startDateObj,
      endDate: t.endDateObj,
    }));
    return calculateTimelineRange(dateTasks);
  }, [processedTasks, backlogTasks, activeDeveloperTasks, activeTab]);

  // Generate month columns
  const monthColumns: MonthColumn[] = useMemo(() => {
    if (!timelineRange) return [];
    return generateMonthsBetween(timelineRange.start, timelineRange.end);
  }, [timelineRange]);

  // Calculate summaries
  const backlogSummary = useMemo(() => {
    return calculateBacklogSummary(tasks);
  }, [tasks]);

  const developerSummary = useMemo(() => {
    if (activeTab === 'overview' || activeTab === 'backlog') return null;
    return calculateDeveloperSummary(tasks, activeTab, workingHoursPerDay);
  }, [tasks, activeTab, workingHoursPerDay]);

  const projectSummary = useMemo(() => {
    return calculateProjectSummary(developers, tasks, workingHoursPerDay);
  }, [developers, tasks, workingHoursPerDay]);

  // Get active developer
  const activeDeveloper = useMemo(() => {
    if (activeTab === 'overview' || activeTab === 'backlog') return null;
    return getDeveloperById(developers, activeTab);
  }, [developers, activeTab]);

  // Handle add developer
  const handleAddDeveloper = useCallback(() => {
    if (!newDeveloperName.trim()) return;
    setDevelopers(prev => addDeveloper(prev, newDeveloperName));
    setNewDeveloperName('');
    setShowAddDeveloper(false);
  }, [newDeveloperName]);

  // Handle edit developer name
  const handleSaveDeveloperName = useCallback(() => {
    if (!editingDeveloperId || !editingDeveloperName.trim()) return;
    setDevelopers(prev => editDeveloperName(prev, editingDeveloperId, editingDeveloperName));
    setEditingDeveloperId(null);
    setEditingDeveloperName('');
  }, [editingDeveloperId, editingDeveloperName]);

  // Handle delete developer
  const handleDeleteDeveloper = useCallback(() => {
    if (!deleteDeveloperConfirm) return;
    const result = deleteDeveloper(developers, tasks, deleteDeveloperConfirm);
    setDevelopers(result.developers);
    setTasks(result.tasks);
    if (activeTab === deleteDeveloperConfirm) {
      setActiveTab('overview');
    }
    setDeleteDeveloperConfirm(null);
  }, [deleteDeveloperConfirm, developers, tasks, activeTab]);

  // Handle add task
  const handleAddTask = useCallback(() => {
    if (!taskForm.title.trim() || !taskForm.id.trim()) return;

    // Validate task ID
    if (!isTaskIdUnique(tasks, taskForm.id)) {
      setTaskIdError('Task ID must be unique');
      return;
    }

    // Validate Jira URL
    if (taskForm.jiraUrl && !validateJiraUrl(taskForm.jiraUrl)) {
      setJiraUrlError('Invalid URL format');
      return;
    }

    setTasks(prev => createTask(prev, {
      id: taskForm.id,
      title: taskForm.title,
      project: taskForm.project,
      jiraUrl: taskForm.jiraUrl,
      hours: taskForm.hours,
      startDate: taskForm.startDate,
      endDate: taskForm.endDate,
      assignedDeveloperId: taskForm.assignedDeveloperId,
    }));

    setTaskForm({
      id: '',
      title: '',
      project: '',
      jiraUrl: '',
      hours: 40,
      startDate: '2026-01-05',
      endDate: '2026-01-12',
      assignedDeveloperId: null,
    });
    setShowAddTask(false);
    setTaskIdError('');
    setJiraUrlError('');
  }, [taskForm, tasks, workingHoursPerDay]);

  // Handle update task
  const handleUpdateTask = useCallback(() => {
    if (!editingTask || !taskForm.title.trim()) return;

    // Validate task ID
    if (!isTaskIdUnique(tasks, taskForm.id, editingTask)) {
      setTaskIdError('Task ID must be unique');
      return;
    }

    // Validate Jira URL
    if (taskForm.jiraUrl && !validateJiraUrl(taskForm.jiraUrl)) {
      setJiraUrlError('Invalid URL format');
      return;
    }

    console.log('🔄 handleUpdateTask called with dates:', {
      startDate: taskForm.startDate,
      endDate: taskForm.endDate,
      startDate_type: typeof taskForm.startDate,
      endDate_type: typeof taskForm.endDate
    });
    
    setTasks(prev => updateTask(prev, editingTask, {
      id: taskForm.id,
      title: taskForm.title,
      project: taskForm.project,
      jiraUrl: taskForm.jiraUrl,
      hours: taskForm.hours,
      startDate: taskForm.startDate,
      endDate: taskForm.endDate,
      assignedDeveloperId: taskForm.assignedDeveloperId,
    }));

    setEditingTask(null);
    setTaskForm({
      id: '',
      title: '',
      project: '',
      jiraUrl: '',
      hours: 40,
      startDate: '2026-01-05',
      endDate: '2026-01-12',
      assignedDeveloperId: null,
    });
    setTaskIdError('');
    setJiraUrlError('');
  }, [editingTask, taskForm, tasks, workingHoursPerDay]);

  // Handle delete task
  const handleDeleteTask = useCallback(() => {
    if (!deleteTaskConfirm) return;
    setTasks(prev => deleteTask(prev, deleteTaskConfirm));
    setDeleteTaskConfirm(null);
  }, [deleteTaskConfirm]);

  // Handle import tasks
  const handleImportTasks = useCallback((importedTasks: Task[]) => {
    console.log('📥 Importing', importedTasks.length, 'tasks');
    
    // Add all imported tasks to the state
    setTasks(prev => {
      const newTasks = [...prev, ...importedTasks];
      console.log('✅ Tasks imported, total count:', newTasks.length);
      return newTasks;
    });
    
    setShowImportModal(false);
  }, []);

  // Handle assign task
  const handleAssignTask = useCallback(() => {
    if (!assigningTaskId || !assigningToDeveloper) return;
    setTasks(prev => assignTask(prev, assigningTaskId, assigningToDeveloper));
    setAssigningTaskId(null);
    setAssigningToDeveloper('');
  }, [assigningTaskId, assigningToDeveloper]);

  // Handle unassign task
  const handleUnassignTask = useCallback((taskId: string) => {
    setTasks(prev => unassignTask(prev, taskId));
  }, []);

  // Handle open edit task modal
  const handleOpenEditTask = useCallback((task: ProcessedTask) => {
    console.log('📝 Opening edit modal for task:', task.id, {
      startDate: task.startDate,
      endDate: task.endDate,
      startDate_type: typeof task.startDate,
      endDate_type: typeof task.endDate
    });
    
    setEditingTask(task.id);
    setTaskForm({
      id: task.id,
      title: task.title,
      project: task.project,
      jiraUrl: task.jiraUrl,
      hours: task.hours,
      startDate: task.startDate,
      endDate: task.endDate,
      assignedDeveloperId: task.assignedDeveloperId,
    });
    setTaskIdError('');
    setJiraUrlError('');
  }, []);

  // Handle open add task modal
  const handleOpenAddTask = useCallback((defaultDeveloperId?: string) => {
    setTaskForm({
      id: getNextTaskId(tasks),
      title: '',
      project: '',
      jiraUrl: '',
      hours: 40,
      startDate: '2026-01-05',
      endDate: '2026-01-12',
      assignedDeveloperId: defaultDeveloperId || null,
    });
    setTaskIdError('');
    setJiraUrlError('');
    setShowAddTask(true);
  }, [tasks]);

  // Handle export
  const handleExport = useCallback(() => {
    if (activeTab === 'overview') {
      exportAllDevelopersToExcel(developers, tasks, projects, workingHoursPerDay);
    } else if (activeTab !== 'backlog' && activeDeveloper) {
      exportDeveloperToExcel(activeDeveloper, tasks, developers, workingHoursPerDay);
    }
  }, [activeTab, activeDeveloper, developers, tasks, projects, workingHoursPerDay]);

  // Handle tooltip
  const handleBarMouseEnter = useCallback(
    (task: ProcessedTask, e: React.MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltipData({
        task,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    },
    []
  );

  const handleBarMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  // Render task row
  const renderTaskRow = (task: ProcessedTask, showAssignButton: boolean = false) => {
    return (
      <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3 text-sm font-mono">{task.id}</td>
        <td className="px-4 py-3 text-sm font-medium">{task.title}</td>
        <td className="px-4 py-3 text-sm">{task.project}</td>
        <td className="px-4 py-3 text-sm">
          {task.jiraUrl ? (
            <a
              href={task.jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {extractJiraTicketId(task.jiraUrl)} ↗
            </a>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-center">{task.hours}h</td>
        <td className="px-4 py-3 text-sm text-center">{formatDate(task.startDateObj)}</td>
        <td className="px-4 py-3 text-sm text-center">{formatDate(task.endDateObj)}</td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            {showAssignButton ? (
              <button
                onClick={() => {
                  setAssigningTaskId(task.id);
                  setAssigningToDeveloper('');
                }}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Assign
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenEditTask(task)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {task.assignedDeveloperId && (
                  <button
                    onClick={() => handleUnassignTask(task.id)}
                    className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded"
                    title="Unassign"
                  >
                    Unassign
                  </button>
                )}
                <button
                  onClick={() => setDeleteTaskConfirm(task.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gantt Chart Planner</h1>
              <p className="text-sm text-gray-500 mt-1">Multi-developer project management with backlog</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Working Hours / Day:</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={workingHoursPerDay}
                  onChange={(e) => setWorkingHoursPerDay(Math.max(1, Math.min(24, parseInt(e.target.value) || 8)))}
                  className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <button
                onClick={() => setShowAddDeveloper(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                + Add Developer
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('backlog')}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'backlog' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Backlog ({backlogTasks.length})
            </button>
            {developers.map(dev => (
              <div key={dev.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab(dev.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                    activeTab === dev.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dev.color }}></span>
                    {dev.name}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setEditingDeveloperId(dev.id);
                    setEditingDeveloperName(dev.name);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteDeveloperConfirm(dev.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Total Tasks</div>
                <div className="text-2xl font-bold">{projectSummary.totalTasks}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Assigned</div>
                <div className="text-2xl font-bold">{projectSummary.assignedTasks}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Backlog</div>
                <div className="text-2xl font-bold">{projectSummary.backlogTasks}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Total Hours</div>
                <div className="text-2xl font-bold">{projectSummary.totalHours}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Backlog Hours</div>
                <div className="text-2xl font-bold">{projectSummary.backlogHours}</div>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="mb-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
            >
              Export All to Excel
            </button>
          </>
        )}

        {/* Backlog Tab */}
        {activeTab === 'backlog' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Backlog Tasks</div>
                <div className="text-2xl font-bold">{backlogSummary.totalTasks}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Backlog Hours</div>
                <div className="text-2xl font-bold">{backlogSummary.totalHours}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Projects</div>
                <div className="text-2xl font-bold">{backlogSummary.totalProjects}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => handleOpenAddTask()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                + Add New Task
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                📥 Import Tasks
              </button>
            </div>
          </>
        )}

        {/* Developer Tab */}
        {activeDeveloper && (
          <>
            {developerSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-500">Tasks</div>
                  <div className="text-2xl font-bold">{developerSummary.totalTasks}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-500">Hours</div>
                  <div className="text-2xl font-bold">{developerSummary.totalHours}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-500">Working Days</div>
                  <div className="text-2xl font-bold">{developerSummary.totalWorkingDays}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-500">Timeline</div>
                  <div className="text-sm font-semibold">
                    {developerSummary.projectStart && developerSummary.projectEnd
                      ? `${formatDate(developerSummary.projectStart)} → ${formatDate(developerSummary.projectEnd)}`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => handleOpenAddTask(activeDeveloper.id)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                + Add Task
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                📥 Import Tasks
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                Export Excel
              </button>
            </div>
          </>
        )}

        {/* Task Table */}
        {activeTab === 'backlog' && backlogTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Task ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jira</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Start</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">End</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backlogTasks.map(task => renderTaskRow(task, true))}
              </tbody>
            </table>
          </div>
        )}

        {activeDeveloper && activeDeveloperTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Task ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jira</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Start</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">End</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDeveloperTasks.map(task => renderTaskRow(task, false))}
              </tbody>
            </table>
          </div>
        )}

        {/* Gantt Chart */}
        {activeTab !== 'backlog' && processedTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-r border-gray-200 w-64">
                      {activeTab === 'overview' ? 'Developer / Task' : 'Task'}
                    </th>
                    {monthColumns.map(mc => (
                      <th key={`${mc.year}-${mc.month}`} className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase border-l border-gray-200 min-w-[120px]">
                        {mc.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'overview' ? processedTasks.filter(t => t.assignedDeveloperId) : activeDeveloperTasks).map(task => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          {task.developerColor && (
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: task.developerColor }}></span>
                          )}
                          <span className="font-medium">{task.title}</span>
                        </div>
                      </td>
                      {monthColumns.map(mc => {
                        const monthStart = new Date(mc.year, mc.month, 1);
                        const monthEnd = new Date(mc.year, mc.month + 1, 0);
                        const daysInMonth = getDaysInMonth(mc.year, mc.month);
                        const taskOverlapsMonth = task.startDateObj <= monthEnd && task.endDateObj >= monthStart;

                        if (!taskOverlapsMonth) {
                          return <td key={`${mc.year}-${mc.month}`} className="px-1 py-3 border-l border-gray-200 h-12"></td>;
                        }

                        const barStart = task.startDateObj > monthStart ? task.startDateObj : monthStart;
                        const barEnd = task.endDateObj < monthEnd ? task.endDateObj : monthEnd;
                        const startDay = barStart.getDate();
                        const endDay = barEnd.getDate();
                        const leftPercent = ((startDay - 1) / daysInMonth) * 100;
                        const widthPercent = ((endDay - startDay + 1) / daysInMonth) * 100;

                        return (
                          <td key={`${mc.year}-${mc.month}`} className="px-1 py-3 border-l border-gray-200 h-12 relative">
                            <div className="h-8 relative">
                              <div
                                className="absolute top-0.5 h-[28px] rounded-md cursor-pointer hover:brightness-110"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                  backgroundColor: task.developerColor || '#6B7280',
                                  minWidth: '6px',
                                }}
                                onMouseEnter={(e) => handleBarMouseEnter(task, e)}
                                onMouseLeave={handleBarMouseLeave}
                              ></div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals would go here - abbreviated for brevity */}
      {/* Add Developer Modal */}
      {showAddDeveloper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Add Developer</h2>
            <input
              type="text"
              value={newDeveloperName}
              onChange={(e) => setNewDeveloperName(e.target.value)}
              placeholder="Developer name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddDeveloper(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAddDeveloper} className="px-4 py-2 text-white bg-blue-600 rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {assigningTaskId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Assign Task</h2>
            <select
              value={assigningToDeveloper}
              onChange={(e) => setAssigningToDeveloper(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            >
              <option value="">Select Developer</option>
              {developers.map(dev => (
                <option key={dev.id} value={dev.id}>{dev.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setAssigningTaskId(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAssignTask} className="px-4 py-2 text-white bg-blue-600 rounded-lg">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {(showAddTask || editingTask) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task ID</label>
                <input
                  type="text"
                  value={taskForm.id}
                  onChange={(e) => setTaskForm({ ...taskForm, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {taskIdError && <p className="text-red-600 text-xs mt-1">{taskIdError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Enter task title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <input
                  type="text"
                  value={taskForm.project}
                  onChange={(e) => setTaskForm({ ...taskForm, project: e.target.value })}
                  placeholder="Enter project name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jira URL</label>
                <input
                  type="url"
                  value={taskForm.jiraUrl}
                  onChange={(e) => setTaskForm({ ...taskForm, jiraUrl: e.target.value })}
                  placeholder="https://jira.company.com/browse/PROJ-123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {jiraUrlError && <p className="text-red-600 text-xs mt-1">{jiraUrlError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours (for record-keeping)</label>
                <input
                  type="number"
                  min="1"
                  value={taskForm.hours}
                  onChange={(e) => setTaskForm({ ...taskForm, hours: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={taskForm.endDate}
                  onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Developer</label>
                <select
                  value={taskForm.assignedDeveloperId || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedDeveloperId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Backlog (Unassigned)</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setEditingTask(null);
                  setTaskIdError('');
                  setJiraUrlError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingTask ? handleUpdateTask : handleAddTask}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Developer Name Modal */}
      {editingDeveloperId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Developer Name</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer Name</label>
                <input
                  type="text"
                  value={editingDeveloperName}
                  onChange={(e) => setEditingDeveloperName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDeveloperName(); }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingDeveloperId(null);
                  setEditingDeveloperName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDeveloperName}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Developer Confirmation Modal */}
      {deleteDeveloperConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Developer</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{developers.find(d => d.id === deleteDeveloperConfirm)?.name}</strong>?
                  <br />All their tasks will be moved to backlog.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDeveloperConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDeveloper}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {deleteTaskConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this task?
                  <br />This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTaskConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Tasks Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportTasks}
        existingTaskIds={tasks.map(t => t.id)}
        existingDeveloperIds={developers.map(d => d.id)}
      />

      {/* Tooltip */}
      {tooltipData && (
        <div className="fixed z-50 pointer-events-none" style={{ left: tooltipData.x, top: tooltipData.y, transform: 'translate(-50%, -100%)' }}>
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <div className="font-semibold mb-1">{tooltipData.task.title}</div>
            <div className="text-gray-300 space-y-0.5">
              {tooltipData.task.developerName && <div>Developer: {tooltipData.task.developerName}</div>}
              <div>Project: {tooltipData.task.project}</div>
              {tooltipData.task.jiraUrl && <div>Jira: {extractJiraTicketId(tooltipData.task.jiraUrl)}</div>}
              <div>Start: {formatDate(tooltipData.task.startDateObj)}</div>
              <div>End: {formatDate(tooltipData.task.endDateObj)}</div>
              <div>Hours: {tooltipData.task.hours}</div>
              <div>Duration: {tooltipData.task.workingDays} working days</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
