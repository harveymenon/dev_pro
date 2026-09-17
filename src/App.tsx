import { useState, useMemo, useCallback, useEffect } from 'react';
import { Developer, ProcessedTask, MonthColumn } from './types';
import {
  calculateEndDate,
  calculateWorkingDays,
  generateMonthsBetween,
  calculateTimelineRange,
  formatDate,
  formatDateISO,
  parseDate,
  getDaysInMonth,
} from './utils/dateUtils';
import {
  DEVELOPER_COLORS,
  getNextDeveloperId,
  getNextTaskId,
  isTaskIdUnique,
  getNextDeveloperColor,
  addDeveloper,
  editDeveloperName,
  deleteDeveloper,
  addTaskToDeveloper,
  updateTaskInDeveloper,
  deleteTaskFromDeveloper,
  recalculateAllEndDates,
  getProcessedTasksForDeveloper,
  getAllProcessedTasks,
  calculateDeveloperSummary,
  calculateProjectSummary,
  getDeveloperById,
} from './utils/developerUtils';
import {
  saveDevelopers,
  loadDevelopers,
  saveWorkingHours,
  loadWorkingHours,
  saveActiveTab,
  loadActiveTab,
} from './utils/storageUtils';
import {
  exportDeveloperToExcel,
  exportAllDevelopersToExcel,
} from './utils/excelUtils';

// Sample data
const SAMPLE_DEVELOPERS: Developer[] = [
  {
    id: 'DEV-001',
    name: 'Robb',
    color: DEVELOPER_COLORS[0],
    tasks: [
      {
        id: 'TASK-001',
        title: 'Requirements Analysis',
        hours: 40,
        startDate: '2026-01-05',
        endDate: '',
      },
      {
        id: 'TASK-002',
        title: 'UI Development',
        hours: 120,
        startDate: '2026-01-12',
        endDate: '',
      },
    ],
  },
  {
    id: 'DEV-002',
    name: 'John',
    color: DEVELOPER_COLORS[1],
    tasks: [
      {
        id: 'TASK-003',
        title: 'Backend Development',
        hours: 160,
        startDate: '2026-02-02',
        endDate: '',
      },
      {
        id: 'TASK-004',
        title: 'API Integration',
        hours: 80,
        startDate: '2026-02-23',
        endDate: '',
      },
    ],
  },
  {
    id: 'DEV-003',
    name: 'Sarah',
    color: DEVELOPER_COLORS[2],
    tasks: [
      {
        id: 'TASK-005',
        title: 'QA Testing',
        hours: 80,
        startDate: '2026-03-02',
        endDate: '',
      },
      {
        id: 'TASK-006',
        title: 'Regression Testing',
        hours: 40,
        startDate: '2026-03-16',
        endDate: '',
      },
    ],
  },
];

export default function App() {
  // Load initial state from localStorage or use sample data
  const [developers, setDevelopers] = useState<Developer[]>(() => {
    const saved = loadDevelopers();
    if (saved && saved.length > 0) {
      return saved;
    }
    // Initialize sample data with calculated end dates
    return SAMPLE_DEVELOPERS.map(dev => ({
      ...dev,
      tasks: dev.tasks.map(task => {
        const start = parseDate(task.startDate);
        const end = calculateEndDate(start, task.hours, 8);
        return { ...task, endDate: formatDateISO(end) };
      }),
    }));
  });

  const [workingHoursPerDay, setWorkingHoursPerDay] = useState<number>(() => loadWorkingHours());
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = loadActiveTab();
    return saved || 'overview';
  });

  // Modal states
  const [showAddDeveloper, setShowAddDeveloper] = useState(false);
  const [newDeveloperName, setNewDeveloperName] = useState('');
  const [editingDeveloperId, setEditingDeveloperId] = useState<string | null>(null);
  const [editingDeveloperName, setEditingDeveloperName] = useState('');
  const [deleteDeveloperConfirm, setDeleteDeveloperConfirm] = useState<string | null>(null);

  // Task modal states
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<{ devId: string; taskId: string } | null>(null);
  const [taskForm, setTaskForm] = useState({
    id: '',
    title: '',
    hours: 40,
    startDate: '2026-01-05',
  });
  const [taskIdError, setTaskIdError] = useState('');

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    task: ProcessedTask;
    x: number;
    y: number;
  } | null>(null);

  // Delete task confirmation
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<{ devId: string; taskId: string } | null>(null);

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveDevelopers(developers);
  }, [developers]);

  useEffect(() => {
    saveWorkingHours(workingHoursPerDay);
  }, [workingHoursPerDay]);

  useEffect(() => {
    saveActiveTab(activeTab);
  }, [activeTab]);

  // Recalculate all end dates when working hours change
  useEffect(() => {
    setDevelopers(prev => recalculateAllEndDates(prev, workingHoursPerDay));
  }, [workingHoursPerDay]);

  // Get active developer
  const activeDeveloper = useMemo(() => {
    if (activeTab === 'overview') return null;
    return getDeveloperById(developers, activeTab);
  }, [developers, activeTab]);

  // Get processed tasks for active developer or overview
  const processedTasks = useMemo((): ProcessedTask[] => {
    if (activeTab === 'overview') {
      return getAllProcessedTasks(developers, workingHoursPerDay);
    }
    const dev = getDeveloperById(developers, activeTab);
    if (!dev) return [];
    return getProcessedTasksForDeveloper(dev, workingHoursPerDay);
  }, [developers, activeTab, workingHoursPerDay]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const dateTasks = processedTasks.map(t => ({
      startDate: t.startDateObj,
      endDate: t.endDateObj,
    }));
    return calculateTimelineRange(dateTasks);
  }, [processedTasks]);

  // Generate month columns
  const monthColumns: MonthColumn[] = useMemo(() => {
    if (!timelineRange) return [];
    return generateMonthsBetween(timelineRange.start, timelineRange.end);
  }, [timelineRange]);

  // Calculate summaries
  const developerSummary = useMemo(() => {
    if (!activeDeveloper) return null;
    return calculateDeveloperSummary(activeDeveloper, workingHoursPerDay);
  }, [activeDeveloper, workingHoursPerDay]);

  const projectSummary = useMemo(() => {
    return calculateProjectSummary(developers, workingHoursPerDay);
  }, [developers, workingHoursPerDay]);

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
    setDevelopers(prev => deleteDeveloper(prev, deleteDeveloperConfirm));
    if (activeTab === deleteDeveloperConfirm) {
      setActiveTab('overview');
    }
    setDeleteDeveloperConfirm(null);
  }, [deleteDeveloperConfirm, activeTab]);

  // Handle add task
  const handleAddTask = useCallback(() => {
    if (!taskForm.title.trim() || !taskForm.id.trim()) return;

    // Check if task ID is unique
    if (!isTaskIdUnique(developers, taskForm.id)) {
      setTaskIdError('Task ID must be unique across all developers');
      return;
    }

    setDevelopers(prev =>
      addTaskToDeveloper(prev, activeTab, {
        id: taskForm.id,
        title: taskForm.title,
        hours: taskForm.hours,
        startDate: taskForm.startDate,
      }, workingHoursPerDay)
    );

    setTaskForm({ id: '', title: '', hours: 40, startDate: '2026-01-05' });
    setShowAddTask(false);
    setTaskIdError('');
  }, [taskForm, developers, activeTab, workingHoursPerDay]);

  // Handle edit task
  const handleUpdateTask = useCallback(() => {
    if (!editingTask || !taskForm.title.trim()) return;

    // Check if task ID is unique (excluding current task)
    if (!isTaskIdUnique(developers, taskForm.id, editingTask.devId, editingTask.taskId)) {
      setTaskIdError('Task ID must be unique across all developers');
      return;
    }

    setDevelopers(prev =>
      updateTaskInDeveloper(prev, editingTask.devId, editingTask.taskId, {
        id: taskForm.id,
        title: taskForm.title,
        hours: taskForm.hours,
        startDate: taskForm.startDate,
      }, workingHoursPerDay)
    );

    setEditingTask(null);
    setTaskForm({ id: '', title: '', hours: 40, startDate: '2026-01-05' });
    setTaskIdError('');
  }, [editingTask, taskForm, developers, workingHoursPerDay]);

  // Handle delete task
  const handleDeleteTask = useCallback(() => {
    if (!deleteTaskConfirm) return;
    setDevelopers(prev =>
      deleteTaskFromDeveloper(prev, deleteTaskConfirm.devId, deleteTaskConfirm.taskId)
    );
    setDeleteTaskConfirm(null);
  }, [deleteTaskConfirm]);

  // Handle open edit task modal
  const handleOpenEditTask = useCallback((task: ProcessedTask) => {
    setEditingTask({ devId: task.developerId, taskId: task.id });
    setTaskForm({
      id: task.id,
      title: task.title,
      hours: task.hours,
      startDate: task.startDate,
    });
    setTaskIdError('');
  }, []);

  // Handle open add task modal
  const handleOpenAddTask = useCallback(() => {
    setTaskForm({
      id: getNextTaskId(developers),
      title: '',
      hours: 40,
      startDate: '2026-01-05',
    });
    setTaskIdError('');
    setShowAddTask(true);
  }, [developers]);

  // Handle export
  const handleExport = useCallback(() => {
    if (activeTab === 'overview') {
      exportAllDevelopersToExcel(developers, workingHoursPerDay);
    } else if (activeDeveloper) {
      exportDeveloperToExcel(activeDeveloper, workingHoursPerDay);
    }
  }, [activeTab, activeDeveloper, developers, workingHoursPerDay]);

  // Handle reset demo data
  const handleResetDemoData = useCallback(() => {
    if (confirm('Are you sure you want to reset to demo data? All current data will be lost.')) {
      const resetData = SAMPLE_DEVELOPERS.map(dev => ({
        ...dev,
        tasks: dev.tasks.map(task => {
          const start = parseDate(task.startDate);
          const end = calculateEndDate(start, task.hours, 8);
          return { ...task, endDate: formatDateISO(end) };
        }),
      }));
      setDevelopers(resetData);
      setActiveTab('overview');
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Gantt Chart Planner
              </h1>
              <p className="text-sm text-gray-500 mt-1">Multi-developer project planning</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Working Hours / Day:
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={workingHoursPerDay}
                  onChange={(e) => setWorkingHoursPerDay(Math.max(1, Math.min(24, parseInt(e.target.value) || 8)))}
                  className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowAddDeveloper(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Developer
              </button>
              <button
                onClick={handleResetDemoData}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Developer Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {/* Overview Tab */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>

            {/* Developer Tabs */}
            {developers.map(dev => (
              <div key={dev.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab(dev.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === dev.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: dev.color }}
                    ></span>
                    {dev.name}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setEditingDeveloperId(dev.id);
                    setEditingDeveloperName(dev.name);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                  title="Edit developer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteDeveloperConfirm(dev.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                  title="Delete developer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add Developer Button */}
            <button
              onClick={() => setShowAddDeveloper(true)}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg whitespace-nowrap transition-colors"
            >
              + Add Developer
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Add Developer Modal */}
      {showAddDeveloper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Developer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer Name</label>
                <input
                  type="text"
                  value={newDeveloperName}
                  onChange={(e) => setNewDeveloperName(e.target.value)}
                  placeholder="Enter developer name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddDeveloper(); }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddDeveloper(false);
                  setNewDeveloperName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDeveloper}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Developer
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDeveloperName}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Developer Confirmation */}
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
                  Are you sure you want to delete <strong>{getDeveloperById(developers, deleteDeveloperConfirm)?.name}</strong>?
                  <br />All tasks will also be removed.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDeveloperConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDeveloper}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Task Modal */}
      {(showAddTask || editingTask) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task ID</label>
                <input
                  type="text"
                  value={taskForm.id}
                  onChange={(e) => {
                    setTaskForm({ ...taskForm, id: e.target.value });
                    setTaskIdError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours Needed</label>
                <input
                  type="number"
                  min="1"
                  value={taskForm.hours}
                  onChange={(e) => setTaskForm({ ...taskForm, hours: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setEditingTask(null);
                  setTaskIdError('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTask ? handleUpdateTask : handleAddTask}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation */}
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
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTaskConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipData.x,
            top: tooltipData.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs">
            <div className="font-semibold mb-1">{tooltipData.task.title}</div>
            <div className="text-gray-300 space-y-0.5">
              <div>Developer: {tooltipData.task.developerName}</div>
              <div>Start: {formatDate(tooltipData.task.startDateObj)}</div>
              <div>End: {formatDate(tooltipData.task.endDateObj)}</div>
              <div>Hours: {tooltipData.task.hours}</div>
              <div>Duration: {tooltipData.task.workingDays} working days</div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Developers</div>
              <div className="text-2xl font-bold text-gray-900">{projectSummary.totalDevelopers}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
              <div className="text-2xl font-bold text-gray-900">{projectSummary.totalTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Hours</div>
              <div className="text-2xl font-bold text-gray-900">{projectSummary.totalHours}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Timeline</div>
              <div className="text-sm font-semibold text-gray-900">
                {projectSummary.projectStart && projectSummary.projectEnd
                  ? `${formatDate(projectSummary.projectStart)} → ${formatDate(projectSummary.projectEnd)}`
                  : 'N/A'}
              </div>
            </div>
          </div>
        ) : developerSummary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
              <div className="text-2xl font-bold text-gray-900">{developerSummary.totalTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Hours</div>
              <div className="text-2xl font-bold text-gray-900">{developerSummary.totalHours}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Working Days</div>
              <div className="text-2xl font-bold text-gray-900">{developerSummary.totalWorkingDays}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Timeline</div>
              <div className="text-sm font-semibold text-gray-900">
                {developerSummary.projectStart && developerSummary.projectEnd
                  ? `${formatDate(developerSummary.projectStart)} → ${formatDate(developerSummary.projectEnd)}`
                  : 'N/A'}
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {activeTab === 'overview' ? (
              <h2 className="text-xl font-bold text-gray-900">Project Overview</h2>
            ) : activeDeveloper ? (
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: activeDeveloper.color }}
                ></span>
                {activeDeveloper.name}'s Tasks
              </h2>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {activeTab !== 'overview' && (
              <button
                onClick={handleOpenAddTask}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {activeTab === 'overview' ? 'Export All' : 'Export Excel'}
            </button>
          </div>
        </div>

        {/* Gantt Chart Table */}
        {processedTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No tasks yet</h3>
            <p className="text-gray-400 mb-4">
              {activeTab === 'overview'
                ? 'Add tasks to developers to see the project overview'
                : 'Add your first task to get started'}
            </p>
            {activeTab !== 'overview' && (
              <button
                onClick={handleOpenAddTask}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                {/* Header */}
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {activeTab === 'overview' && (
                      <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-32">
                        Developer
                      </th>
                    )}
                    <th className={`sticky ${activeTab === 'overview' ? 'left-32' : 'left-0'} z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-24`}>
                      ID
                    </th>
                    <th className={`sticky ${activeTab === 'overview' ? 'left-56' : 'left-24'} z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[180px]`}>
                      Task
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-20">
                      Hours
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-28">
                      Start
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-28">
                      End
                    </th>
                    {activeTab !== 'overview' && (
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    )}
                    {/* Month headers */}
                    {monthColumns.map((mc) => (
                      <th
                        key={`${mc.year}-${mc.month}`}
                        className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-200 min-w-[120px]"
                      >
                        {mc.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                {/* Body */}
                <tbody>
                  {processedTasks.map((task, index) => {
                    const isEven = index % 2 === 0;

                    return (
                      <tr
                        key={`${task.developerId}-${task.id}`}
                        className={`border-b border-gray-100 group transition-colors ${
                          isEven ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-blue-50`}
                      >
                        {activeTab === 'overview' && (
                          <td className={`sticky left-0 z-10 px-4 py-3 text-sm font-medium border-r border-gray-200 ${
                            isEven ? 'bg-white group-hover:bg-blue-50' : 'bg-gray-50 group-hover:bg-blue-50'
                          }`}>
                            <span className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: task.developerColor }}
                              ></span>
                              <span className="text-gray-700">{task.developerName}</span>
                            </span>
                          </td>
                        )}
                        <td className={`sticky ${activeTab === 'overview' ? 'left-32' : 'left-0'} z-10 px-4 py-3 text-sm font-mono font-medium text-gray-800 border-r border-gray-200 ${
                          isEven ? 'bg-white group-hover:bg-blue-50' : 'bg-gray-50 group-hover:bg-blue-50'
                        }`}>
                          {task.id}
                        </td>
                        <td className={`sticky ${activeTab === 'overview' ? 'left-56' : 'left-24'} z-10 px-4 py-3 text-sm text-gray-700 border-r border-gray-200 ${
                          isEven ? 'bg-white group-hover:bg-blue-50' : 'bg-gray-50 group-hover:bg-blue-50'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: task.developerColor }}
                            ></span>
                            <span className="font-medium truncate">{task.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-center text-gray-600 border-r border-gray-200">
                          {task.hours}h
                        </td>
                        <td className="px-3 py-3 text-sm text-center text-gray-600 border-r border-gray-200 whitespace-nowrap">
                          {formatDate(task.startDateObj)}
                        </td>
                        <td className="px-3 py-3 text-sm text-center text-gray-600 border-r border-gray-200 whitespace-nowrap">
                          {formatDate(task.endDateObj)}
                        </td>
                        {activeTab !== 'overview' && (
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditTask(task)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit task"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteTaskConfirm({ devId: task.developerId, taskId: task.id })}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete task"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        )}
                        {/* Gantt Timeline Cells */}
                        {monthColumns.map((mc) => {
                          const monthStart = new Date(mc.year, mc.month, 1);
                          const monthEnd = new Date(mc.year, mc.month + 1, 0);
                          const daysInMonth = getDaysInMonth(mc.year, mc.month);

                          // Check if task overlaps with this month
                          const taskOverlapsMonth = task.startDateObj <= monthEnd && task.endDateObj >= monthStart;

                          if (!taskOverlapsMonth) {
                            return (
                              <td
                                key={`${mc.year}-${mc.month}`}
                                className="px-1 py-3 border-l border-gray-200 h-12 relative"
                              >
                                <div className="h-8 relative">
                                  {/* Weekend shading */}
                                  {Array.from({ length: daysInMonth }, (_, i) => {
                                    const dayDate = new Date(mc.year, mc.month, i + 1);
                                    if (dayDate.getDay() === 0 || dayDate.getDay() === 6) {
                                      const dayLeft = (i / daysInMonth) * 100;
                                      const dayWidth = (1 / daysInMonth) * 100;
                                      return (
                                        <div
                                          key={i}
                                          className="absolute top-0 h-full bg-gray-100/60"
                                          style={{ left: `${dayLeft}%`, width: `${dayWidth}%` }}
                                        />
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              </td>
                            );
                          }

                          // Calculate bar position within this month cell
                          const barStart = task.startDateObj > monthStart ? task.startDateObj : monthStart;
                          const barEnd = task.endDateObj < monthEnd ? task.endDateObj : monthEnd;

                          const startDay = barStart.getDate();
                          const endDay = barEnd.getDate();

                          const leftPercent = ((startDay - 1) / daysInMonth) * 100;
                          const widthPercent = ((endDay - startDay + 1) / daysInMonth) * 100;

                          return (
                            <td
                              key={`${mc.year}-${mc.month}`}
                              className="px-1 py-3 border-l border-gray-200 h-12 relative"
                            >
                              <div className="h-8 relative">
                                {/* Weekend shading */}
                                {Array.from({ length: daysInMonth }, (_, i) => {
                                  const dayDate = new Date(mc.year, mc.month, i + 1);
                                  if (dayDate.getDay() === 0 || dayDate.getDay() === 6) {
                                    const dayLeft = (i / daysInMonth) * 100;
                                    const dayWidth = (1 / daysInMonth) * 100;
                                    return (
                                      <div
                                        key={i}
                                        className="absolute top-0 h-full bg-gray-100/60"
                                        style={{ left: `${dayLeft}%`, width: `${dayWidth}%` }}
                                      />
                                    );
                                  }
                                  return null;
                                })}
                                {/* Gantt bar */}
                                <div
                                  className="absolute top-0.5 h-[28px] rounded-md cursor-pointer transition-all hover:brightness-110 hover:shadow-lg hover:scale-y-110 flex items-center overflow-hidden"
                                  style={{
                                    left: `${leftPercent}%`,
                                    width: `${widthPercent}%`,
                                    backgroundColor: task.developerColor,
                                    minWidth: '6px',
                                    zIndex: 5,
                                  }}
                                  onMouseEnter={(e) => handleBarMouseEnter(task, e)}
                                  onMouseLeave={handleBarMouseLeave}
                                >
                                  <div className="w-full h-full rounded-md opacity-25 bg-gradient-to-b from-white to-transparent"></div>
                                  {widthPercent > 15 && (
                                    <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-white truncate drop-shadow-sm">
                                      {task.title}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
