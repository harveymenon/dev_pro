// Timesheet utility functions
import { TimesheetEntry, WeeklySummary, DeveloperPerformance, DashboardKPIs } from '../types';

/**
 * Get week number from date
 */
export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Get week start date (Monday)
 */
export function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Get week end date (Sunday)
 */
export function getWeekEndDate(date: Date): Date {
  const startDate = getWeekStartDate(date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return endDate;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate derived fields for a timesheet entry
 */
export function calculateDerivedFields(entry: Omit<TimesheetEntry, 'weekNumber' | 'weekStartDate' | 'weekEndDate' | 'month' | 'year'>): TimesheetEntry {
  const date = new Date(entry.date);
  const weekStartDate = getWeekStartDate(date);
  const weekEndDate = getWeekEndDate(date);
  
  return {
    ...entry,
    weekNumber: getWeekNumber(date),
    weekStartDate: formatDateISO(weekStartDate),
    weekEndDate: formatDateISO(weekEndDate),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

/**
 * Group timesheet entries by developer and week
 */
export function groupByDeveloperAndWeek(entries: TimesheetEntry[]): Map<string, Map<number, TimesheetEntry[]>> {
  const grouped = new Map<string, Map<number, TimesheetEntry[]>>();
  
  entries.forEach(entry => {
    if (!grouped.has(entry.developerId)) {
      grouped.set(entry.developerId, new Map());
    }
    
    const developerWeeks = grouped.get(entry.developerId)!;
    if (!developerWeeks.has(entry.weekNumber)) {
      developerWeeks.set(entry.weekNumber, []);
    }
    
    developerWeeks.get(entry.weekNumber)!.push(entry);
  });
  
  return grouped;
}

/**
 * Calculate weekly summary for a developer
 */
export function calculateWeeklySummary(
  developerId: string,
  developerName: string,
  weekNumber: number,
  entries: TimesheetEntry[]
): WeeklySummary {
  const totalHours = entries.reduce((sum, e) => sum + e.hoursSpent, 0);
  const uniqueTaskIds = new Set(entries.map(e => e.taskId));
  const taskCount = entries.length;
  const uniqueTasks = uniqueTaskIds.size;
  const avgHoursPerTask = uniqueTasks > 0 ? totalHours / uniqueTasks : 0;
  
  // Get week dates from first entry
  const weekStartDate = entries[0]?.weekStartDate || '';
  const weekEndDate = entries[0]?.weekEndDate || '';
  
  return {
    developerId,
    developerName,
    weekNumber,
    weekStartDate,
    weekEndDate,
    totalHours,
    taskCount,
    uniqueTasks,
    avgHoursPerTask,
    utilization: 0, // Will be calculated later with standard weekly hours
    tasks: entries,
  };
}

/**
 * Calculate developer performance metrics
 */
export function calculateDeveloperPerformance(
  entries: TimesheetEntry[],
  standardWeeklyHours: number
): DeveloperPerformance[] {
  const grouped = groupByDeveloperAndWeek(entries);
  const performances: DeveloperPerformance[] = [];
  
  grouped.forEach((weeks, developerId) => {
    const developerName = entries.find(e => e.developerId === developerId)?.developerName || 'Unknown';
    const weeklySummaries: WeeklySummary[] = [];
    
    weeks.forEach((weekEntries, weekNumber) => {
      const summary = calculateWeeklySummary(developerId, developerName, weekNumber, weekEntries);
      summary.utilization = (summary.totalHours / standardWeeklyHours) * 100;
      weeklySummaries.push(summary);
    });
    
    const totalHours = entries.filter(e => e.developerId === developerId).reduce((sum, e) => sum + e.hoursSpent, 0);
    const totalTasks = entries.filter(e => e.developerId === developerId).length;
    const uniqueTaskIds = new Set(entries.filter(e => e.developerId === developerId).map(e => e.taskId));
    const avgHoursPerTask = uniqueTaskIds.size > 0 ? totalHours / uniqueTaskIds.size : 0;
    const avgUtilization = weeklySummaries.length > 0 
      ? weeklySummaries.reduce((sum, w) => sum + w.utilization, 0) / weeklySummaries.length 
      : 0;
    
    // Calculate project distribution
    const projectDistribution: { [project: string]: number } = {};
    entries.filter(e => e.developerId === developerId).forEach(entry => {
      const project = entry.portal || 'Unknown';
      projectDistribution[project] = (projectDistribution[project] || 0) + entry.hoursSpent;
    });
    
    // Calculate environment distribution
    const environmentDistribution: { [env: string]: number } = {};
    entries.filter(e => e.developerId === developerId).forEach(entry => {
      const env = entry.environment || 'Other';
      environmentDistribution[env] = (environmentDistribution[env] || 0) + entry.hoursSpent;
    });
    
    performances.push({
      developerId,
      developerName,
      totalHours,
      totalTasks,
      avgHoursPerTask,
      avgUtilization,
      weeks: weeklySummaries.sort((a, b) => b.weekNumber - a.weekNumber),
      projectDistribution,
      environmentDistribution,
    });
  });
  
  return performances.sort((a, b) => b.totalHours - a.totalHours);
}

/**
 * Calculate dashboard KPIs
 */
export function calculateDashboardKPIs(
  entries: TimesheetEntry[],
  developers: { id: string; name: string }[],
  standardWeeklyHours: number
): DashboardKPIs {
  const totalDevelopers = new Set(entries.map(e => e.developerId)).size;
  const totalHours = entries.reduce((sum, e) => sum + e.hoursSpent, 0);
  const avgHoursPerDeveloper = totalDevelopers > 0 ? totalHours / totalDevelopers : 0;
  const totalTasks = new Set(entries.map(e => e.taskId)).size;
  
  // Calculate current week and last week hours
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();
  const lastWeek = currentWeek === 1 ? 52 : currentWeek - 1;
  const lastWeekYear = currentWeek === 1 ? currentYear - 1 : currentYear;
  
  const hoursThisWeek = entries
    .filter(e => e.weekNumber === currentWeek && e.year === currentYear)
    .reduce((sum, e) => sum + e.hoursSpent, 0);
  
  const hoursLastWeek = entries
    .filter(e => e.weekNumber === lastWeek && e.year === lastWeekYear)
    .reduce((sum, e) => sum + e.hoursSpent, 0);
  
  // Calculate average weekly hours
  const weeks = new Set(entries.map(e => `${e.year}-W${e.weekNumber}`));
  const avgWeeklyHours = weeks.size > 0 ? totalHours / weeks.size : 0;
  
  // Calculate overall utilization
  const overallUtilization = standardWeeklyHours > 0 && weeks.size > 0
    ? (avgWeeklyHours / standardWeeklyHours) * 100
    : 0;
  
  return {
    totalDevelopers,
    totalHours,
    avgHoursPerDeveloper,
    totalTasks,
    avgWeeklyHours,
    overallUtilization,
    hoursThisWeek,
    hoursLastWeek,
  };
}

/**
 * Generate unique ID for timesheet entry
 */
export function generateTimesheetEntryId(): string {
  return `TS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get unique weeks from timesheet entries
 */
export function getUniqueWeeks(entries: TimesheetEntry[]): { weekNumber: number; year: number; startDate: string; endDate: string }[] {
  const weekMap = new Map<string, { weekNumber: number; year: number; startDate: string; endDate: string }>();
  
  entries.forEach(entry => {
    const key = `${entry.year}-W${entry.weekNumber}`;
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        weekNumber: entry.weekNumber,
        year: entry.year,
        startDate: entry.weekStartDate,
        endDate: entry.weekEndDate,
      });
    }
  });
  
  return Array.from(weekMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });
}

/**
 * Filter timesheet entries by date range
 */
export function filterByDateRange(
  entries: TimesheetEntry[],
  startDate: string,
  endDate: string
): TimesheetEntry[] {
  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return entryDate >= start && entryDate <= end;
  });
}

/**
 * Filter timesheet entries by developer
 */
export function filterByDeveloper(
  entries: TimesheetEntry[],
  developerId: string
): TimesheetEntry[] {
  return entries.filter(entry => entry.developerId === developerId);
}

/**
 * Filter timesheet entries by project/portal
 */
export function filterByProject(
  entries: TimesheetEntry[],
  portal: string
): TimesheetEntry[] {
  return entries.filter(entry => entry.portal === portal);
}

/**
 * Filter timesheet entries by environment
 */
export function filterByEnvironment(
  entries: TimesheetEntry[],
  environment: string
): TimesheetEntry[] {
  return entries.filter(entry => entry.environment === environment);
}
