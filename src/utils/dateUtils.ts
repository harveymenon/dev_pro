// Date utility functions for Gantt chart calculations
import { MonthColumn } from '../types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Calculate the number of working days between two dates (inclusive of start, inclusive of end)
 * Excludes weekends
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Add a specific number of working days to a start date
 * Excludes weekends
 */
export function addWorkingDays(startDate: Date, workingDays: number): Date {
  const result = new Date(startDate);
  result.setHours(0, 0, 0, 0);

  // If start date is a weekend, move to next Monday
  if (isWeekend(result)) {
    while (isWeekend(result)) {
      result.setDate(result.getDate() + 1);
    }
  }

  let daysAdded = 0;
  while (daysAdded < workingDays - 1) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Calculate end date given start date, hours needed, and working hours per day
 * Excludes weekends
 */
export function calculateEndDate(
  startDate: Date,
  hoursNeeded: number,
  workingHoursPerDay: number
): Date {
  if (hoursNeeded <= 0 || workingHoursPerDay <= 0) {
    return new Date(startDate);
  }

  const workingDaysNeeded = Math.ceil(hoursNeeded / workingHoursPerDay);
  return addWorkingDays(startDate, workingDaysNeeded);
}

/**
 * Get the start date of a month (first day)
 */
export function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Get the end date of a month (last day)
 */
export function getMonthEnd(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Generate array of months between two dates
 */
export function generateMonthsBetween(startDate: Date, endDate: Date): MonthColumn[] {
  const months: MonthColumn[] = [];

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth(),
      label: `${MONTH_NAMES[current.getMonth()]} ${current.getFullYear()}`,
      shortLabel: MONTH_NAMES[current.getMonth()],
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Calculate the timeline range (min start date, max end date) across all tasks
 */
export function calculateTimelineRange(tasks: { startDate: Date; endDate: Date }[]): { start: Date; end: Date } | null {
  if (tasks.length === 0) return null;

  let minStart = new Date(tasks[0].startDate);
  let maxEnd = new Date(tasks[0].endDate);

  for (const task of tasks) {
    if (task.startDate < minStart) minStart = new Date(task.startDate);
    if (task.endDate > maxEnd) maxEnd = new Date(task.endDate);
  }

  // Expand to month boundaries
  minStart = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
  maxEnd = new Date(maxEnd.getFullYear(), maxEnd.getMonth() + 1, 0);

  return { start: minStart, end: maxEnd };
}

/**
 * Calculate the position (left %) and width (%) of a Gantt bar within the timeline
 */
export function calculateBarPosition(
  taskStart: Date,
  taskEnd: Date,
  timelineStart: Date,
  timelineEnd: Date
): { left: number; width: number } {
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();
  if (totalMs <= 0) return { left: 0, width: 100 };

  const taskStartMs = taskStart.getTime();

  // Add one day to end date so the bar covers the full end date
  const adjustedEnd = new Date(taskEnd);
  adjustedEnd.setDate(adjustedEnd.getDate() + 1);
  adjustedEnd.setHours(23, 59, 59, 999);

  const left = ((taskStartMs - timelineStart.getTime()) / totalMs) * 100;
  const width = ((adjustedEnd.getTime() - taskStartMs) / totalMs) * 100;

  return {
    left: Math.max(0, left),
    width: Math.min(100 - left, Math.max(0.5, width))
  };
}

/**
 * Calculate bar position within a specific month cell
 */
export function calculateBarPositionInMonth(
  taskStart: Date,
  taskEnd: Date,
  monthYear: number,
  monthIndex: number
): { left: number; width: number } | null {
  const monthStart = new Date(monthYear, monthIndex, 1);
  const monthEnd = new Date(monthYear, monthIndex + 1, 0);
  const daysInMonth = getDaysInMonth(monthYear, monthIndex);

  // Check if task overlaps with this month
  if (taskStart > monthEnd || taskEnd < monthStart) {
    return null;
  }

  // Calculate bar position within this month cell
  const barStart = taskStart > monthStart ? taskStart : monthStart;
  const barEnd = taskEnd < monthEnd ? taskEnd : monthEnd;

  const startDay = barStart.getDate();
  const endDay = barEnd.getDate();

  const leftPercent = ((startDay - 1) / daysInMonth) * 100;
  const widthPercent = ((endDay - startDay + 1) / daysInMonth) * 100;

  return { left: leftPercent, width: widthPercent };
}

/**
 * Format date to readable string (e.g., "Jan 5, 2026")
 */
export function formatDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Format date to short format (e.g., "Jan 5")
 */
export function formatDateShort(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Format date to Excel-friendly format (e.g., "05-Jan-2026")
 */
export function formatDateExcel(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${MONTH_NAMES[date.getMonth()]}-${date.getFullYear()}`;
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
 * Parse ISO date string to Date object
 */
export function parseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) {
    console.warn('parseDate called with null/undefined, returning current date');
    return new Date();
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's date as ISO string
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}

/**
 * Sanitize a string for use as a filename
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_').trim();
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

/**
 * Get the month name
 */
export function getMonthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] || '';
}

/**
 * Get the full month name
 */
export function getMonthNameFull(monthIndex: number): string {
  return MONTH_NAMES_FULL[monthIndex] || '';
}

/**
 * Calculate total working days for a set of tasks
 */
export function calculateTotalWorkingDays(tasks: { startDate: Date; endDate: Date }[]): number {
  return tasks.reduce((total, task) => {
    return total + calculateWorkingDays(task.startDate, task.endDate);
  }, 0);
}

/**
 * Calculate total hours for a set of tasks
 */
export function calculateTotalHours(tasks: { hours: number }[]): number {
  return tasks.reduce((total, task) => total + task.hours, 0);
}
