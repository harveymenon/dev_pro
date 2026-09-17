import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Task, MonthColumn } from './types';
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

// Task colors for Gantt bars
const TASK_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

// Sample data
const SAMPLE_TASKS: Task[] = [
  {
    id: 'TASK-001',
    title: 'Requirements Analysis',
    hours: 40,
    startDate: '2026-01-05',
    endDate: '',
    color: TASK_COLORS[0],
  },
  {
    id: 'TASK-002',
    title: 'UI Development',
    hours: 120,
    startDate: '2026-01-12',
    endDate: '',
    color: TASK_COLORS[1],
  },
  {
    id: 'TASK-003',
    title: 'Backend Development',
    hours: 160,
    startDate: '2026-02-02',
    endDate: '',
    color: TASK_COLORS[2],
  },
  {
    id: 'TASK-004',
    title: 'Testing & QA',
    hours: 80,
    startDate: '2026-03-02',
    endDate: '',
    color: TASK_COLORS[3],
  },
  {
    id: 'TASK-005',
    title: 'Deployment & Launch',
    hours: 24,
    startDate: '2026-03-23',
    endDate: '',
    color: TASK_COLORS[4],
  },
];

function getNextTaskId(tasks: Task[]): string {
  let maxNum = 0;
  for (const task of tasks) {
    const match = task.id.match(/TASK-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `TASK-${String(maxNum + 1).padStart(3, '0')}`;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    return SAMPLE_TASKS.map((t) => {
      const start = parseDate(t.startDate);
      const end = calculateEndDate(start, t.hours, 8);
      return { ...t, endDate: formatDateISO(end) };
    });
  });
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(8);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    hours: 40,
    startDate: '2026-01-05',
  });
  const [tooltipData, setTooltipData] = useState<{
    task: Task;
    x: number;
    y: number;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Recalculate all end dates when working hours change
  const processedTasks = useMemo(() => {
    return tasks.map((task) => {
      const start = parseDate(task.startDate);
      const end = calculateEndDate(start, task.hours, workingHoursPerDay);
      return { ...task, endDate: formatDateISO(end) };
    });
  }, [tasks, workingHoursPerDay]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const dateTasks = processedTasks.map((t) => ({
      startDate: parseDate(t.startDate),
      endDate: parseDate(t.endDate),
    }));
    return calculateTimelineRange(dateTasks);
  }, [processedTasks]);

  // Generate month columns
  const monthColumns: MonthColumn[] = useMemo(() => {
    if (!timelineRange) return [];
    return generateMonthsBetween(timelineRange.start, timelineRange.end);
  }, [timelineRange]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!formData.title.trim()) return;

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? { ...t, title: formData.title, hours: formData.hours, startDate: formData.startDate }
            : t
        )
      );
      setEditingTask(null);
    } else {
      const newTask: Task = {
        id: formData.id || getNextTaskId(tasks),
        title: formData.title,
        hours: formData.hours,
        startDate: formData.startDate,
        endDate: '',
        color: TASK_COLORS[tasks.length % TASK_COLORS.length],
      };
      setTasks((prev) => [...prev, newTask]);
    }

    setFormData({ id: '', title: '', hours: 40, startDate: '2026-01-05' });
    setShowForm(false);
  }, [formData, editingTask, tasks]);

  // Handle task deletion
  const handleDelete = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // Handle task edit
  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setFormData({
      id: task.id,
      title: task.title,
      hours: task.hours,
      startDate: task.startDate,
    });
    setShowForm(true);
  }, []);

  // Handle add new task
  const handleAddNew = useCallback(() => {
    setEditingTask(null);
    setFormData({
      id: getNextTaskId(tasks),
      title: '',
      hours: 40,
      startDate: '2026-01-05',
    });
    setShowForm(true);
  }, [tasks]);

  // Handle tooltip
  const handleBarMouseEnter = useCallback(
    (task: Task, e: React.MouseEvent) => {
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

  // Scroll to today indicator on mount
  useEffect(() => {
    if (tableRef.current && timelineRange) {
      const today = new Date();
      if (today >= timelineRange.start && today <= timelineRange.end) {
        const totalMs = timelineRange.end.getTime() - timelineRange.start.getTime();
        const todayOffset = ((today.getTime() - timelineRange.start.getTime()) / totalMs) * 100;
        const scrollContainer = tableRef.current.querySelector('.gantt-timeline-scroll');
        if (scrollContainer) {
          const scrollWidth = scrollContainer.scrollWidth;
          scrollContainer.scrollLeft = (todayOffset / 100) * scrollWidth - scrollContainer.clientWidth / 2;
        }
      }
    }
  }, [timelineRange]);

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
              <p className="text-sm text-gray-500 mt-1">Plan and visualize your project timeline</p>
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
                onClick={handleAddNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Task Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowForm(false);
              setEditingTask(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingTask}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
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
                  Are you sure you want to delete <strong>{processedTasks.find(t => t.id === deleteConfirm)?.title}</strong>?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }}
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
              <div>Start: {formatDate(parseDate(tooltipData.task.startDate))}</div>
              <div>End: {formatDate(parseDate(tooltipData.task.endDate))}</div>
              <div>Hours: {tooltipData.task.hours}</div>
              <div>
                Duration: {calculateWorkingDays(parseDate(tooltipData.task.startDate), parseDate(tooltipData.task.endDate)) + 1} working days
              </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {processedTasks.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No tasks yet</h3>
            <p className="text-gray-400 mb-4">Add your first task to get started with the Gantt chart</p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          </div>
        ) : (
          <div ref={tableRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto gantt-timeline-scroll relative">
              {/* Today indicator line */}
              {timelineRange && (() => {
                const today = new Date();
                today.setHours(12, 0, 0, 0);
                if (today >= timelineRange.start && today <= timelineRange.end) {
                  const totalMs = timelineRange.end.getTime() - timelineRange.start.getTime();
                  const todayPercent = ((today.getTime() - timelineRange.start.getTime()) / totalMs) * 100;
                  // Calculate offset for fixed columns (ID + Task + Hours + Start + End + Actions)
                  const fixedColumnsWidth = 96 + 180 + 80 + 112 + 112 + 80; // approximate px
                  return (
                    <div
                      className="absolute top-0 bottom-0 z-30 pointer-events-none"
                      style={{
                        left: `calc(${fixedColumnsWidth}px + (100% - ${fixedColumnsWidth}px) * ${todayPercent / 100})`,
                      }}
                    >
                      <div className="w-0.5 h-full bg-red-400 opacity-60"></div>
                      <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-b font-medium whitespace-nowrap">
                        Today
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              <table className="w-full min-w-[900px]">
                {/* Header */}
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-24">
                      ID
                    </th>
                    <th className="sticky left-24 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[180px]">
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
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                      Actions
                    </th>
                    {/* Month headers */}
                    {monthColumns.map((mc) => {
                      const today = new Date();
                      const isCurrentMonth = today.getFullYear() === mc.year && today.getMonth() === mc.month;
                      return (
                        <th
                          key={`${mc.year}-${mc.month}`}
                          className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider border-l border-gray-200 min-w-[120px] relative ${
                            isCurrentMonth ? 'text-blue-700 bg-blue-50/50' : 'text-gray-600'
                          }`}
                        >
                          {mc.label}
                          {isCurrentMonth && (
                            <span className="block text-[10px] font-normal text-blue-500 mt-0.5">
                              Today: {today.getDate()}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                {/* Body */}
                <tbody>
                  {processedTasks.map((task, index) => {
                    const taskStart = parseDate(task.startDate);
                    const taskEnd = parseDate(task.endDate);
                    const isEven = index % 2 === 0;

                    return (
                      <tr
                        key={task.id}
                        className={`border-b border-gray-100 group transition-colors ${
                          isEven ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-blue-50`}
                      >
                        <td className={`sticky left-0 z-10 px-4 py-3 text-sm font-mono font-medium text-gray-800 border-r border-gray-200 ${
                          isEven ? 'bg-white group-hover:bg-blue-50' : 'bg-gray-50 group-hover:bg-blue-50'
                        }`}>
                          {task.id}
                        </td>
                        <td className={`sticky left-24 z-10 px-4 py-3 text-sm text-gray-700 border-r border-gray-200 ${
                          isEven ? 'bg-white group-hover:bg-blue-50' : 'bg-gray-50 group-hover:bg-blue-50'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: task.color }}
                            ></span>
                            <span className="font-medium truncate">{task.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-center text-gray-600 border-r border-gray-200">
                          {task.hours}h
                        </td>
                        <td className="px-3 py-3 text-sm text-center text-gray-600 border-r border-gray-200 whitespace-nowrap">
                          {formatDate(taskStart)}
                        </td>
                        <td className="px-3 py-3 text-sm text-center text-gray-600 border-r border-gray-200 whitespace-nowrap">
                          {formatDate(taskEnd)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(task)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit task"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(task.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete task"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        {/* Gantt Timeline Cells */}
                        {monthColumns.map((mc) => {
                          const monthStart = new Date(mc.year, mc.month, 1);
                          const monthEnd = new Date(mc.year, mc.month + 1, 0);
                          const daysInMonth = getDaysInMonth(mc.year, mc.month);

                          // Check if task overlaps with this month
                          const taskOverlapsMonth = taskStart <= monthEnd && taskEnd >= monthStart;

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
                          const barStart = taskStart > monthStart ? taskStart : monthStart;
                          const barEnd = taskEnd < monthEnd ? taskEnd : monthEnd;

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
                                    backgroundColor: task.color,
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

            {/* Summary footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-800">{processedTasks.length}</span> tasks
              </div>
              <div>
                Total: <span className="font-medium text-gray-800">{processedTasks.reduce((sum, t) => sum + t.hours, 0)} hours</span>
              </div>
              <div>
                Working hours/day: <span className="font-medium text-gray-800">{workingHoursPerDay}h</span>
              </div>
              {timelineRange && (
                <div>
                  Timeline: <span className="font-medium text-gray-800">{formatDate(timelineRange.start)} — {formatDate(timelineRange.end)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
