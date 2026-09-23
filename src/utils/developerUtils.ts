// Developer and Task management utility functions
import { Developer, Task, ProcessedTask, DeveloperSummary, ProjectSummary, BacklogSummary } from '../types';
import {
  calculateEndDate,
  calculateWorkingDays,
  calculateTimelineRange,
  formatDateISO,
  parseDate,
} from './dateUtils';

// Developer colors palette
export const DEVELOPER_COLORS = [
  '#4F46E5', // Indigo
  '#0891B2', // Cyan
  '#16A34A', // Green
  '#EA580C', // Orange
  '#9333EA', // Purple
  '#DB2777', // Pink
  '#2563EB', // Blue
  '#D97706', // Amber
  '#059669', // Emerald
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#0D9488', // Teal
];

// Default projects
export const DEFAULT_PROJECTS = [
  'Tres Health',
  'Shopmool',
  'Hamsarjo',
  'ZeusIP',
  'Other',
];

/**
 * Get the next available developer ID
 */
export function getNextDeveloperId(developers: Developer[]): string {
  let maxNum = 0;
  for (const dev of developers) {
    const match = dev.id.match(/DEV-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `DEV-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Get the next available task ID
 */
export function getNextTaskId(tasks: Task[]): string {
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

/**
 * Check if a task ID is unique
 */
export function isTaskIdUnique(tasks: Task[], taskId: string, excludeTaskId?: string): boolean {
  for (const task of tasks) {
    if (excludeTaskId && task.id === excludeTaskId) continue;
    if (task.id === taskId) return false;
  }
  return true;
}

/**
 * Get the next available color for a new developer
 */
export function getNextDeveloperColor(developers: Developer[]): string {
  const usedColors = new Set(developers.map(d => d.color));
  for (const color of DEVELOPER_COLORS) {
    if (!usedColors.has(color)) return color;
  }
  return DEVELOPER_COLORS[developers.length % DEVELOPER_COLORS.length];
}

/**
 * Add a new developer
 */
export function addDeveloper(developers: Developer[], name: string): Developer[] {
  const newDev: Developer = {
    id: getNextDeveloperId(developers),
    name: name.trim(),
    color: getNextDeveloperColor(developers),
  };
  return [...developers, newDev];
}

/**
 * Edit a developer's name
 */
export function editDeveloperName(developers: Developer[], devId: string, newName: string): Developer[] {
  return developers.map(dev =>
    dev.id === devId ? { ...dev, name: newName.trim() } : dev
  );
}

/**
 * Delete a developer and unassign their tasks
 */
export function deleteDeveloper(developers: Developer[], tasks: Task[], devId: string): { developers: Developer[]; tasks: Task[] } {
  const updatedTasks = tasks.map(task =>
    task.assignedDeveloperId === devId ? { ...task, assignedDeveloperId: null } : task
  );
  const updatedDevelopers = developers.filter(dev => dev.id !== devId);
  return { developers: updatedDevelopers, tasks: updatedTasks };
}

/**
 * Create a new task
 */
export function createTask(
  tasks: Task[],
  taskData: Task
): Task[] {
  // Calculate sortOrder for the new task
  const developerTasks = tasks.filter(t => t.assignedDeveloperId === taskData.assignedDeveloperId);
  const maxSortOrder = developerTasks.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1);
  const newSortOrder = maxSortOrder + 1;
  
  const newTask = {
    ...taskData,
    sortOrder: newSortOrder,
  };
  
  return [...tasks, newTask];
}

/**
 * Update a task
 */
export function updateTask(
  tasks: Task[],
  taskId: string,
  updates: Partial<Task>
): Task[] {
  console.log('🔧 updateTask called for', taskId, 'with updates:', {
    startDate: updates.startDate,
    endDate: updates.endDate
  });
  
  const result = tasks.map(task => {
    if (task.id !== taskId) return task;
    const updated = { ...task, ...updates };
    console.log('✅ Task', taskId, 'updated from', {
      old_start: task.startDate,
      old_end: task.endDate
    }, 'to', {
      new_start: updated.startDate,
      new_end: updated.endDate
    });
    return updated;
  });
  
  return result;
}
/**
 * Delete a task
 */
export function deleteTask(tasks: Task[], taskId: string): Task[] {
  return tasks.filter(task => task.id !== taskId);
}

/**
 * Assign a task to a developer
 */
export function assignTask(tasks: Task[], taskId: string, developerId: string): Task[] {
  return tasks.map(task =>
    task.id === taskId ? { ...task, assignedDeveloperId: developerId } : task
  );
}

/**
 * Unassign a task (move to backlog)
 */
export function unassignTask(tasks: Task[], taskId: string): Task[] {
  return tasks.map(task =>
    task.id === taskId ? { ...task, assignedDeveloperId: null } : task
  );
}

/**
 * Reorder tasks within a developer's board
 */
export function reorderTasks(tasks: Task[], activeId: string, overId: string): Task[] {
  const oldIndex = tasks.findIndex(t => t.id === activeId);
  const newIndex = tasks.findIndex(t => t.id === overId);
  
  if (oldIndex === -1 || newIndex === -1) return tasks;
  
  const result = [...tasks];
  const [removed] = result.splice(oldIndex, 1);
  result.splice(newIndex, 0, removed);
  
  // Update sortOrder for all tasks
  return result.map((task, index) => ({
    ...task,
    sortOrder: index,
  }));
}

/**
 * Recalculate all end dates for all tasks
 */
export function recalculateAllEndDates(tasks: Task[], workingHoursPerDay: number): Task[] {
  return tasks.map(task => {
    const startDate = parseDate(task.startDate);
    const endDate = calculateEndDate(startDate, task.hours, workingHoursPerDay);
    return { ...task, endDate: formatDateISO(endDate) };
  });
}

/**
 * Get backlog tasks (unassigned)
 */
export function getBacklogTasks<T extends Task>(tasks: T[]): T[] {
  return tasks.filter(task => task.assignedDeveloperId === null);
}

/**
 * Get tasks for a specific developer
 */
export function getDeveloperTasks<T extends Task>(tasks: T[], developerId: string): T[] {
  return tasks
    .filter(task => task.assignedDeveloperId === developerId)
    .sort((a, b) => (a.sortOrder ?? 999999) - (b.sortOrder ?? 999999));
}

/**
 * Get processed tasks with calculated fields
 */
export function getProcessedTasks(
  tasks: Task[],
  developers: Developer[],
  workingHoursPerDay: number
): ProcessedTask[] {
  return tasks.map(task => {
    const startDateObj = parseDate(task.startDate);
    const endDateObj = parseDate(task.endDate);
    const workingDays = calculateWorkingDays(startDateObj, endDateObj);

    let developerId: string | null = null;
    let developerName: string | null = null;
    let developerColor: string | null = null;

    if (task.assignedDeveloperId) {
      const developer = developers.find(d => d.id === task.assignedDeveloperId);
      if (developer) {
        developerId = developer.id;
        developerName = developer.name;
        developerColor = developer.color;
      }
    }

    return {
      ...task,
      developerId,
      developerName,
      developerColor,
      startDateObj,
      endDateObj,
      workingDays,
    };
  });
}

/**
 * Calculate backlog summary
 */
export function calculateBacklogSummary(tasks: Task[]): BacklogSummary {
  const backlogTasks = getBacklogTasks(tasks);
  const projects = new Set(backlogTasks.map(t => t.project).filter(p => p));

  return {
    totalTasks: backlogTasks.length,
    totalHours: backlogTasks.reduce((sum, t) => sum + t.hours, 0),
    totalProjects: projects.size,
  };
}

/**
 * Calculate developer summary
 */
export function calculateDeveloperSummary(
  tasks: Task[],
  developerId: string,
  workingHoursPerDay: number
): DeveloperSummary {
  const devTasks = getDeveloperTasks(tasks, developerId);
  const processedTasks = devTasks.map(task => ({
    startDate: parseDate(task.startDate),
    endDate: parseDate(task.endDate),
    hours: task.hours,
  }));

  if (processedTasks.length === 0) {
    return {
      totalTasks: 0,
      totalHours: 0,
      totalWorkingDays: 0,
      projectStart: null,
      projectEnd: null,
    };
  }

  const range = calculateTimelineRange(processedTasks);

  return {
    totalTasks: processedTasks.length,
    totalHours: processedTasks.reduce((sum, t) => sum + t.hours, 0),
    totalWorkingDays: processedTasks.reduce((sum, t) => {
      return sum + calculateWorkingDays(t.startDate, t.endDate);
    }, 0),
    projectStart: range?.start || null,
    projectEnd: range?.end || null,
  };
}

/**
 * Calculate project summary
 */
export function calculateProjectSummary(
  developers: Developer[],
  tasks: Task[],
  workingHoursPerDay: number
): ProjectSummary {
  const backlogTasks = getBacklogTasks(tasks);
  const assignedTasks = tasks.filter(t => t.assignedDeveloperId !== null);

  const allProcessedTasks = tasks.map(task => ({
    startDate: parseDate(task.startDate),
    endDate: parseDate(task.endDate),
    hours: task.hours,
  }));

  const range = allProcessedTasks.length > 0 ? calculateTimelineRange(allProcessedTasks) : null;

  return {
    totalDevelopers: developers.length,
    totalTasks: tasks.length,
    assignedTasks: assignedTasks.length,
    backlogTasks: backlogTasks.length,
    totalHours: tasks.reduce((sum, t) => sum + t.hours, 0),
    backlogHours: backlogTasks.reduce((sum, t) => sum + t.hours, 0),
    projectStart: range?.start || null,
    projectEnd: range?.end || null,
  };
}

/**
 * Get a developer by ID
 */
export function getDeveloperById(developers: Developer[], devId: string): Developer | undefined {
  return developers.find(d => d.id === devId);
}

/**
 * Find which developer owns a task
 */
export function findDeveloperByTaskId(tasks: Task[], developers: Developer[], taskId: string): Developer | undefined {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.assignedDeveloperId) return undefined;
  return developers.find(dev => dev.id === task.assignedDeveloperId);
}

/**
 * Validate Jira URL
 */
export function validateJiraUrl(url: string): boolean {
  if (!url) return true; // Empty is valid
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract Jira ticket ID from URL
 */
export function extractJiraTicketId(url: string): string {
  if (!url) return '';
  const match = url.match(/\/browse\/([A-Z]+-\d+)/);
  return match ? match[1] : url;
}
