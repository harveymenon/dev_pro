// Developer management utility functions
import { Developer, Task, ProcessedTask, DeveloperSummary, ProjectSummary } from '../types';
import {
  calculateEndDate,
  calculateWorkingDays,
  calculateTimelineRange,
  calculateTotalWorkingDays,
  calculateTotalHours,
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
 * Get the next available task ID across all developers
 */
export function getNextTaskId(developers: Developer[]): string {
  let maxNum = 0;
  for (const dev of developers) {
    for (const task of dev.tasks) {
      const match = task.id.match(/TASK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  return `TASK-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Check if a task ID is unique across all developers
 */
export function isTaskIdUnique(developers: Developer[], taskId: string, excludeDevId?: string, excludeTaskId?: string): boolean {
  for (const dev of developers) {
    if (excludeDevId && dev.id === excludeDevId) continue;
    for (const task of dev.tasks) {
      if (excludeTaskId && task.id === excludeTaskId) continue;
      if (task.id === taskId) return false;
    }
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
  // If all colors are used, cycle through them
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
    tasks: [],
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
 * Delete a developer
 */
export function deleteDeveloper(developers: Developer[], devId: string): Developer[] {
  return developers.filter(dev => dev.id !== devId);
}

/**
 * Add a task to a developer
 */
export function addTaskToDeveloper(
  developers: Developer[],
  devId: string,
  task: Omit<Task, 'endDate'>,
  workingHoursPerDay: number
): Developer[] {
  const startDate = parseDate(task.startDate);
  const endDate = calculateEndDate(startDate, task.hours, workingHoursPerDay);

  return developers.map(dev => {
    if (dev.id !== devId) return dev;
    return {
      ...dev,
      tasks: [...dev.tasks, {
        ...task,
        endDate: formatDateISO(endDate),
      }],
    };
  });
}

/**
 * Update a task in a developer
 */
export function updateTaskInDeveloper(
  developers: Developer[],
  devId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'endDate'>>,
  workingHoursPerDay: number
): Developer[] {
  return developers.map(dev => {
    if (dev.id !== devId) return dev;
    return {
      ...dev,
      tasks: dev.tasks.map(task => {
        if (task.id !== taskId) return task;
        const updatedTask = { ...task, ...updates };
        // Recalculate end date
        const startDate = parseDate(updatedTask.startDate);
        const endDate = calculateEndDate(startDate, updatedTask.hours, workingHoursPerDay);
        return { ...updatedTask, endDate: formatDateISO(endDate) };
      }),
    };
  });
}

/**
 * Delete a task from a developer
 */
export function deleteTaskFromDeveloper(
  developers: Developer[],
  devId: string,
  taskId: string
): Developer[] {
  return developers.map(dev => {
    if (dev.id !== devId) return dev;
    return {
      ...dev,
      tasks: dev.tasks.filter(task => task.id !== taskId),
    };
  });
}

/**
 * Recalculate all end dates for all tasks (when working hours per day changes)
 */
export function recalculateAllEndDates(developers: Developer[], workingHoursPerDay: number): Developer[] {
  return developers.map(dev => ({
    ...dev,
    tasks: dev.tasks.map(task => {
      const startDate = parseDate(task.startDate);
      const endDate = calculateEndDate(startDate, task.hours, workingHoursPerDay);
      return { ...task, endDate: formatDateISO(endDate) };
    }),
  }));
}

/**
 * Get processed tasks for a developer (with calculated fields)
 */
export function getProcessedTasksForDeveloper(
  developer: Developer,
  workingHoursPerDay: number
): ProcessedTask[] {
  return developer.tasks.map(task => {
    const startDateObj = parseDate(task.startDate);
    const endDateObj = parseDate(task.endDate);
    const workingDays = calculateWorkingDays(startDateObj, endDateObj);

    return {
      ...task,
      developerId: developer.id,
      developerName: developer.name,
      developerColor: developer.color,
      startDateObj,
      endDateObj,
      workingDays,
    };
  });
}

/**
 * Get all processed tasks across all developers
 */
export function getAllProcessedTasks(
  developers: Developer[],
  workingHoursPerDay: number
): ProcessedTask[] {
  const allTasks: ProcessedTask[] = [];
  for (const dev of developers) {
    allTasks.push(...getProcessedTasksForDeveloper(dev, workingHoursPerDay));
  }
  // Sort by start date
  allTasks.sort((a, b) => a.startDateObj.getTime() - b.startDateObj.getTime());
  return allTasks;
}

/**
 * Calculate developer summary
 */
export function calculateDeveloperSummary(
  developer: Developer,
  workingHoursPerDay: number
): DeveloperSummary {
  const processedTasks = getProcessedTasksForDeveloper(developer, workingHoursPerDay);

  if (processedTasks.length === 0) {
    return {
      totalTasks: 0,
      totalHours: 0,
      totalWorkingDays: 0,
      projectStart: null,
      projectEnd: null,
    };
  }

  const dateTasks = processedTasks.map(t => ({
    startDate: t.startDateObj,
    endDate: t.endDateObj,
  }));

  const range = calculateTimelineRange(dateTasks);

  return {
    totalTasks: processedTasks.length,
    totalHours: calculateTotalHours(processedTasks),
    totalWorkingDays: calculateTotalWorkingDays(dateTasks),
    projectStart: range?.start || null,
    projectEnd: range?.end || null,
  };
}

/**
 * Calculate project summary across all developers
 */
export function calculateProjectSummary(
  developers: Developer[],
  workingHoursPerDay: number
): ProjectSummary {
  const allTasks = getAllProcessedTasks(developers, workingHoursPerDay);

  if (allTasks.length === 0) {
    return {
      totalDevelopers: developers.length,
      totalTasks: 0,
      totalHours: 0,
      projectStart: null,
      projectEnd: null,
    };
  }

  const dateTasks = allTasks.map(t => ({
    startDate: t.startDateObj,
    endDate: t.endDateObj,
  }));

  const range = calculateTimelineRange(dateTasks);

  return {
    totalDevelopers: developers.length,
    totalTasks: allTasks.length,
    totalHours: calculateTotalHours(allTasks),
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
export function findDeveloperByTaskId(developers: Developer[], taskId: string): Developer | undefined {
  return developers.find(dev => dev.tasks.some(task => task.id === taskId));
}
