// Date utility functions for Gantt chart calculations

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Calculate the number of working days between two dates (inclusive of start, exclusive of end)
 * Excludes weekends
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
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
  const workingDaysNeeded = Math.ceil(hoursNeeded / workingHoursPerDay);
  const endDate = new Date(startDate);
  endDate.setHours(0, 0, 0, 0);

  let daysAdded = 0;
  while (daysAdded < workingDaysNeeded - 1) {
    endDate.setDate(endDate.getDate() + 1);
    if (!isWeekend(endDate)) {
      daysAdded++;
    }
  }

  // If start date is a weekend, move to the next working day
  if (isWeekend(endDate)) {
    while (isWeekend(endDate)) {
      endDate.setDate(endDate.getDate() + 1);
    }
  }

  return endDate;
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
export function generateMonthsBetween(startDate: Date, endDate: Date): { year: number; month: number; label: string }[] {
  const months: { year: number; month: number; label: string }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth(),
      label: `${monthNames[current.getMonth()]} ${current.getFullYear()}`
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
  const taskEndMs = taskEnd.getTime();

  // Add one day to end date so the bar covers the full end date
  const adjustedEnd = new Date(taskEnd);
  adjustedEnd.setDate(adjustedEnd.getDate() + 1);

  const left = ((taskStartMs - timelineStart.getTime()) / totalMs) * 100;
  const width = ((adjustedEnd.getTime() - taskStartMs) / totalMs) * 100;

  return {
    left: Math.max(0, left),
    width: Math.min(100 - left, width)
  };
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's date as ISO string
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}
