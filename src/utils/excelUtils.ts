// Excel export utility functions using SheetJS (xlsx)
import * as XLSX from 'xlsx';
import { Developer, Task, ProcessedTask, DeveloperSummary, ProjectSummary, BacklogSummary, MonthColumn } from '../types';
import {
  formatDateExcel,
  generateMonthsBetween,
  calculateTimelineRange,
  calculateWorkingDays,
  sanitizeFilename,
  getDaysInMonth,
  parseDate,
} from './dateUtils';
import {
  getProcessedTasks,
  getDeveloperTasks,
  getBacklogTasks,
  calculateDeveloperSummary,
  calculateProjectSummary,
  calculateBacklogSummary,
  extractJiraTicketId,
} from './developerUtils';

// Excel styling helpers
const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '4F46E5' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  },
};

/**
 * Create a summary sheet for a developer
 */
function createSummarySheet(developer: Developer, summary: DeveloperSummary, workingHoursPerDay: number): XLSX.WorkSheet {
  const data: (string | number)[][] = [
    ['Developer Summary', ''],
    ['', ''],
    ['Developer Name:', developer.name],
    ['', ''],
    ['Metric', 'Value'],
    ['Total Tasks', summary.totalTasks],
    ['Total Estimated Hours', summary.totalHours],
    ['Total Working Days', summary.totalWorkingDays],
    ['Project Start', summary.projectStart ? formatDateExcel(summary.projectStart) : 'N/A'],
    ['Project End', summary.projectEnd ? formatDateExcel(summary.projectEnd) : 'N/A'],
    ['', ''],
    ['Working Hours / Day', workingHoursPerDay],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 25 },
    { wch: 20 },
  ];

  if (ws['A1']) {
    ws['A1'].s = { font: { bold: true, sz: 16, color: { rgb: '4F46E5' } } };
  }

  for (const cell of ['A5', 'B5']) {
    if (ws[cell]) {
      ws[cell].s = HEADER_STYLE;
    }
  }

  return ws;
}

/**
 * Create a Gantt sheet for a developer
 */
function createGanttSheet(
  developer: Developer,
  tasks: Task[],
  allTasks: Task[],
  developers: Developer[],
  monthColumns: MonthColumn[],
  workingHoursPerDay: number
): XLSX.WorkSheet {
  // Get processed tasks for this developer
  const processedTasks = getProcessedTasks(tasks, developers, workingHoursPerDay)
    .filter(t => t.assignedDeveloperId === developer.id);

  // Build header row with new fields
  const headers = [
    'Task ID',
    'Task Title',
    'Project',
    'Jira URL',
    'Hours',
    'Start Date',
    'End Date',
    'Working Days',
    ...monthColumns.map(mc => mc.label),
  ];

  const data: (string | number)[][] = [headers];

  for (const task of processedTasks) {
    const row: (string | number)[] = [
      task.id,
      task.title,
      task.project,
      task.jiraUrl ? extractJiraTicketId(task.jiraUrl) : '',
      task.hours,
      formatDateExcel(task.startDateObj),
      formatDateExcel(task.endDateObj),
      task.workingDays,
    ];

    // Add Gantt bar indicators for each month
    for (const mc of monthColumns) {
      const monthStart = new Date(mc.year, mc.month, 1);
      const monthEnd = new Date(mc.year, mc.month + 1, 0);
      const daysInMonth = getDaysInMonth(mc.year, mc.month);

      if (task.startDateObj <= monthEnd && task.endDateObj >= monthStart) {
        const barStart = task.startDateObj > monthStart ? task.startDateObj : monthStart;
        const barEnd = task.endDateObj < monthEnd ? task.endDateObj : monthEnd;
        const startDay = barStart.getDate();
        const endDay = barEnd.getDate();
        const barDays = endDay - startDay + 1;
        const barChars = Math.max(1, Math.round((barDays / daysInMonth) * 10));
        row.push('█'.repeat(barChars));
      } else {
        row.push('');
      }
    }

    data.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  const cols = [
    { wch: 12 },  // Task ID
    { wch: 30 },  // Task Title
    { wch: 20 },  // Project
    { wch: 15 },  // Jira URL
    { wch: 8 },   // Hours
    { wch: 14 },  // Start Date
    { wch: 14 },  // End Date
    { wch: 12 },  // Working Days
    ...monthColumns.map(() => ({ wch: 14 })),
  ];
  ws['!cols'] = cols;

  // Style header row
  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws[cellRef]) {
      ws[cellRef].s = HEADER_STYLE;
    }
  }

  ws['!freeze'] = { xSplit: 1, ySplit: 1 };

  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: headers.length - 1 } }),
  };

  return ws;
}

/**
 * Create a backlog sheet
 */
function createBacklogSheet(
  tasks: Task[],
  developers: Developer[],
  workingHoursPerDay: number
): XLSX.WorkSheet {
  const processedTasks = getProcessedTasks(tasks, developers, workingHoursPerDay)
    .filter(t => t.assignedDeveloperId === null);

  const headers = [
    'Task ID',
    'Task Title',
    'Project',
    'Jira URL',
    'Hours',
    'Start Date',
    'End Date',
    'Working Days',
  ];

  const data: (string | number)[][] = [headers];

  for (const task of processedTasks) {
    data.push([
      task.id,
      task.title,
      task.project,
      task.jiraUrl || '',
      task.hours,
      formatDateExcel(task.startDateObj),
      formatDateExcel(task.endDateObj),
      task.workingDays,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 20 },
    { wch: 30 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
  ];

  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws[cellRef]) {
      ws[cellRef].s = HEADER_STYLE;
    }
  }

  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: headers.length - 1 } }),
  };

  return ws;
}

/**
 * Create a consolidated Gantt sheet for all developers
 */
function createConsolidatedGanttSheet(
  tasks: Task[],
  developers: Developer[],
  monthColumns: MonthColumn[],
  workingHoursPerDay: number
): XLSX.WorkSheet {
  const processedTasks = getProcessedTasks(tasks, developers, workingHoursPerDay)
    .filter(t => t.assignedDeveloperId !== null);

  const headers = [
    'Developer',
    'Task ID',
    'Task Title',
    'Project',
    'Jira URL',
    'Hours',
    'Start Date',
    'End Date',
    'Working Days',
    ...monthColumns.map(mc => mc.label),
  ];

  const data: (string | number)[][] = [headers];

  for (const task of processedTasks) {
    const row: (string | number)[] = [
      task.developerName || '',
      task.id,
      task.title,
      task.project,
      task.jiraUrl ? extractJiraTicketId(task.jiraUrl) : '',
      task.hours,
      formatDateExcel(task.startDateObj),
      formatDateExcel(task.endDateObj),
      task.workingDays,
    ];

    for (const mc of monthColumns) {
      const monthStart = new Date(mc.year, mc.month, 1);
      const monthEnd = new Date(mc.year, mc.month + 1, 0);
      const daysInMonth = getDaysInMonth(mc.year, mc.month);

      if (task.startDateObj <= monthEnd && task.endDateObj >= monthStart) {
        const barStart = task.startDateObj > monthStart ? task.startDateObj : monthStart;
        const barEnd = task.endDateObj < monthEnd ? task.endDateObj : monthEnd;
        const startDay = barStart.getDate();
        const endDay = barEnd.getDate();
        const barDays = endDay - startDay + 1;
        const barChars = Math.max(1, Math.round((barDays / daysInMonth) * 10));
        row.push('█'.repeat(barChars));
      } else {
        row.push('');
      }
    }

    data.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  const cols = [
    { wch: 15 },  // Developer
    { wch: 12 },  // Task ID
    { wch: 30 },  // Task Title
    { wch: 20 },  // Project
    { wch: 15 },  // Jira URL
    { wch: 8 },   // Hours
    { wch: 14 },  // Start Date
    { wch: 14 },  // End Date
    { wch: 12 },  // Working Days
    ...monthColumns.map(() => ({ wch: 14 })),
  ];
  ws['!cols'] = cols;

  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws[cellRef]) {
      ws[cellRef].s = HEADER_STYLE;
    }
  }

  ws['!freeze'] = { xSplit: 2, ySplit: 1 };
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: headers.length - 1 } }),
  };

  return ws;
}

/**
 * Create a project summary sheet
 */
function createProjectSummarySheet(
  developers: Developer[],
  tasks: Task[],
  projectSummary: ProjectSummary,
  workingHoursPerDay: number
): XLSX.WorkSheet {
  const data: (string | number)[][] = [
    ['PROJECT GANTT SUMMARY', ''],
    ['', ''],
    ['Working Hours / Day:', workingHoursPerDay],
    ['', ''],
    ['Total Developers:', projectSummary.totalDevelopers],
    ['Total Tasks:', projectSummary.totalTasks],
    ['Assigned Tasks:', projectSummary.assignedTasks],
    ['Backlog Tasks:', projectSummary.backlogTasks],
    ['Total Hours:', projectSummary.totalHours],
    ['Backlog Hours:', projectSummary.backlogHours],
    ['', ''],
    ['Project Start:', projectSummary.projectStart ? formatDateExcel(projectSummary.projectStart) : 'N/A'],
    ['Project End:', projectSummary.projectEnd ? formatDateExcel(projectSummary.projectEnd) : 'N/A'],
    ['', ''],
    ['', ''],
    ['Developer', 'Tasks', 'Total Hours', 'Working Days', 'Start Date', 'End Date'],
  ];

  // Add per-developer summaries
  for (const dev of developers) {
    const summary = calculateDeveloperSummary(tasks, dev.id, workingHoursPerDay);
    data.push([
      dev.name,
      summary.totalTasks,
      summary.totalHours,
      summary.totalWorkingDays,
      summary.projectStart ? formatDateExcel(summary.projectStart) : 'N/A',
      summary.projectEnd ? formatDateExcel(summary.projectEnd) : 'N/A',
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  if (ws['A1']) {
    ws['A1'].s = { font: { bold: true, sz: 16, color: { rgb: '4F46E5' } } };
  }

  const headerRow = 15;
  for (let i = 0; i < 6; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: i });
    if (ws[cellRef]) {
      ws[cellRef].s = HEADER_STYLE;
    }
  }

  return ws;
}

/**
 * Export a single developer to Excel
 */
export function exportDeveloperToExcel(
  developer: Developer,
  tasks: Task[],
  developers: Developer[],
  workingHoursPerDay: number
): void {
  const devTasks = getDeveloperTasks(tasks, developer.id);
  const summary = calculateDeveloperSummary(tasks, developer.id, workingHoursPerDay);

  const dateTasks = devTasks.map(t => ({ startDate: parseDate(t.startDate), endDate: parseDate(t.endDate) }));
  const range = calculateTimelineRange(dateTasks);

  let monthColumns: MonthColumn[] = [];
  if (range) {
    monthColumns = generateMonthsBetween(range.start, range.end);
  }

  const wb = XLSX.utils.book_new();

  const ganttSheet = createGanttSheet(developer, devTasks, tasks, developers, monthColumns, workingHoursPerDay);
  XLSX.utils.book_append_sheet(wb, ganttSheet, 'Gantt');

  const summarySheet = createSummarySheet(developer, summary, workingHoursPerDay);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  const filename = `${sanitizeFilename(developer.name)}_Gantt_Report.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export all developers to a consolidated Excel workbook
 */
export function exportAllDevelopersToExcel(
  developers: Developer[],
  tasks: Task[],
  projects: string[],
  workingHoursPerDay: number
): void {
  const projectSummary = calculateProjectSummary(developers, tasks, workingHoursPerDay);

  const dateTasks = tasks.map(t => ({ startDate: parseDate(t.startDate), endDate: parseDate(t.endDate) }));
  const range = calculateTimelineRange(dateTasks);

  let monthColumns: MonthColumn[] = [];
  if (range) {
    monthColumns = generateMonthsBetween(range.start, range.end);
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Project Summary
  const summarySheet = createProjectSummarySheet(developers, tasks, projectSummary, workingHoursPerDay);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Project Summary');

  // Sheet 2: Backlog
  const backlogSheet = createBacklogSheet(tasks, developers, workingHoursPerDay);
  XLSX.utils.book_append_sheet(wb, backlogSheet, 'Backlog');

  // Sheet 3: Consolidated Gantt
  const consolidatedSheet = createConsolidatedGanttSheet(tasks, developers, monthColumns, workingHoursPerDay);
  XLSX.utils.book_append_sheet(wb, consolidatedSheet, 'Consolidated Gantt');

  // Sheet 4+: Individual developer sheets
  for (const dev of developers) {
    const devSheet = createGanttSheet(dev, tasks, tasks, developers, monthColumns, workingHoursPerDay);
    const sheetName = dev.name.length > 28 ? dev.name.substring(0, 28) : dev.name;
    XLSX.utils.book_append_sheet(wb, devSheet, sheetName);
  }

  const filename = 'Project_Gantt_All_Developers.xlsx';
  XLSX.writeFile(wb, filename);
}
