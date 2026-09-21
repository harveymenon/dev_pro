// Excel import utility functions
import * as XLSX from 'xlsx';
import { Task } from '../types';
import { getNextTaskId, validateJiraUrl } from './developerUtils';
import { formatDateISO } from './dateUtils';

export interface ImportResult {
  success: boolean;
  tasks: Task[];
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ImportPreview {
  tasks: Task[];
  errors: ImportError[];
  warnings: ImportWarning[];
  totalRows: number;
  validRows: number;
}

/**
 * Parse an Excel file and extract tasks
 */
export async function parseExcelFile(file: File): Promise<ImportPreview> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({
            tasks: [],
            errors: [{ row: 0, field: 'file', message: 'Excel file is empty' }],
            warnings: [],
            totalRows: 0,
            validRows: 0,
          });
          return;
        }
        
        // Find header row
        const headers = jsonData[0] as string[];
        const headerMap = createHeaderMap(headers);
        
        // Parse data rows
        const tasks: Task[] = [];
        const errors: ImportError[] = [];
        const warnings: ImportWarning[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;
          
          const rowNum = i + 1; // Excel row number (1-indexed, +1 for header)
          const taskResult = parseTaskRow(row, headerMap, rowNum);
          
          if (taskResult.errors.length > 0) {
            errors.push(...taskResult.errors);
          } else if (taskResult.task) {
            if (taskResult.warnings.length > 0) {
              warnings.push(...taskResult.warnings);
            }
            tasks.push(taskResult.task);
          }
        }
        
        resolve({
          tasks,
          errors,
          warnings,
          totalRows: jsonData.length - 1, // Exclude header
          validRows: tasks.length,
        });
      } catch (error) {
        resolve({
          tasks: [],
          errors: [{ row: 0, field: 'file', message: `Failed to parse Excel file: ${error}` }],
          warnings: [],
          totalRows: 0,
          validRows: 0,
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        tasks: [],
        errors: [{ row: 0, field: 'file', message: 'Failed to read file' }],
        warnings: [],
        totalRows: 0,
        validRows: 0,
      });
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Create a mapping of column names to indices
 */
function createHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  
  headers.forEach((header, index) => {
    if (!header) return;
    
    const normalizedHeader = header.toLowerCase().trim();
    
    // Map common variations to standard field names
    if (normalizedHeader.includes('task') && normalizedHeader.includes('id')) {
      map.set('id', index);
    } else if (normalizedHeader.includes('task') && normalizedHeader.includes('title')) {
      map.set('title', index);
    } else if (normalizedHeader.includes('title') || normalizedHeader.includes('name')) {
      map.set('title', index);
    } else if (normalizedHeader.includes('project')) {
      map.set('project', index);
    } else if (normalizedHeader.includes('jira') || normalizedHeader.includes('ticket')) {
      map.set('jiraUrl', index);
    } else if (normalizedHeader.includes('hour') || normalizedHeader.includes('effort') || normalizedHeader.includes('estimate')) {
      map.set('hours', index);
    } else if (normalizedHeader.includes('start') && normalizedHeader.includes('date')) {
      map.set('startDate', index);
    } else if (normalizedHeader.includes('start')) {
      map.set('startDate', index);
    } else if (normalizedHeader.includes('end') && normalizedHeader.includes('date')) {
      map.set('endDate', index);
    } else if (normalizedHeader.includes('end')) {
      map.set('endDate', index);
    } else if (normalizedHeader.includes('developer') || normalizedHeader.includes('assignee') || normalizedHeader.includes('assigned')) {
      map.set('assignedDeveloperId', index);
    }
  });
  
  return map;
}

/**
 * Parse a single row into a Task object
 */
function parseTaskRow(
  row: any[],
  headerMap: Map<string, number>,
  rowNum: number
): { task?: Task; errors: ImportError[]; warnings: ImportWarning[] } {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  
  // Get values from row
  const getId = () => getCellValue(row, headerMap.get('id'));
  const getTitle = () => getCellValue(row, headerMap.get('title'));
  const getProject = () => getCellValue(row, headerMap.get('project'));
  const getJiraUrl = () => getCellValue(row, headerMap.get('jiraUrl'));
  const getHours = () => getCellValue(row, headerMap.get('hours'));
  const getStartDate = () => getCellValue(row, headerMap.get('startDate'));
  const getEndDate = () => getCellValue(row, headerMap.get('endDate'));
  const getDeveloperId = () => getCellValue(row, headerMap.get('assignedDeveloperId'));
  
  // Validate required fields
  const title = getTitle();
  if (!title) {
    errors.push({ row: rowNum, field: 'title', message: 'Task title is required' });
    return { errors, warnings };
  }
  
  const startDate = getStartDate();
  if (!startDate) {
    errors.push({ row: rowNum, field: 'startDate', message: 'Start date is required' });
    return { errors, warnings };
  }
  
  const endDate = getEndDate();
  if (!endDate) {
    errors.push({ row: rowNum, field: 'endDate', message: 'End date is required' });
    return { errors, warnings };
  }
  
  // Parse and validate fields
  const id = getId() || ''; // Will be auto-generated if empty
  
  const project = getProject() || '';
  
  const jiraUrl = getJiraUrl() || '';
  if (jiraUrl && !validateJiraUrl(jiraUrl)) {
    warnings.push({ 
      row: rowNum, 
      field: 'jiraUrl', 
      message: 'Invalid Jira URL format',
      value: jiraUrl 
    });
  }
  
  const hours = parseHours(getHours(), rowNum, errors, warnings);
  
  const startDateISO = parseDate(startDate, rowNum, 'startDate', errors);
  if (!startDateISO) {
    return { errors, warnings };
  }
  
  const endDateISO = parseDate(endDate, rowNum, 'endDate', errors);
  if (!endDateISO) {
    return { errors, warnings };
  }
  
  // Validate date range
  if (new Date(endDateISO) < new Date(startDateISO)) {
    errors.push({ 
      row: rowNum, 
      field: 'endDate', 
      message: 'End date must be after start date',
      value: endDate 
    });
    return { errors, warnings };
  }
  
  const assignedDeveloperId = getDeveloperId() || null;
  
  const task: Task = {
    id: id || '', // Will be assigned later
    title: title.trim(),
    project: project.trim(),
    jiraUrl: jiraUrl.trim(),
    hours,
    startDate: startDateISO,
    endDate: endDateISO,
    assignedDeveloperId,
  };
  
  return { task, errors, warnings };
}

/**
 * Get cell value from row
 */
function getCellValue(row: any[], index?: number): string {
  if (index === undefined || index >= row.length) return '';
  const value = row[index];
  return value ? String(value).trim() : '';
}

/**
 * Parse hours value
 */
function parseHours(
  value: string,
  rowNum: number,
  errors: ImportError[],
  warnings: ImportWarning[]
): number {
  if (!value) {
    warnings.push({ row: rowNum, field: 'hours', message: 'Hours not specified, defaulting to 0' });
    return 0;
  }
  
  const hours = parseFloat(value);
  if (isNaN(hours)) {
    errors.push({ 
      row: rowNum, 
      field: 'hours', 
      message: 'Invalid hours value',
      value 
    });
    return 0;
  }
  
  if (hours < 0) {
    warnings.push({ 
      row: rowNum, 
      field: 'hours', 
      message: 'Negative hours value, using absolute value',
      value: hours 
    });
    return Math.abs(hours);
  }
  
  return hours;
}

/**
 * Parse date value to ISO format
 */
function parseDate(
  value: string,
  rowNum: number,
  field: string,
  errors: ImportError[]
): string | null {
  if (!value) return null;
  
  // Try to parse various date formats
  let date: Date | null = null;
  
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date = new Date(value);
  }
  // Try MM/DD/YYYY or DD/MM/YYYY
  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    const parts = value.split('/');
    // Assume MM/DD/YYYY format
    date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  // Try DD-MM-YYYY
  else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) {
    const parts = value.split('-');
    date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  // Try Excel date number
  else if (!isNaN(Number(value))) {
    const excelDate = Number(value);
    // Excel dates are days since 1900-01-01
    date = new Date((excelDate - 25569) * 86400 * 1000);
  }
  // Try general date parsing
  else {
    date = new Date(value);
  }
  
  if (!date || isNaN(date.getTime())) {
    errors.push({ 
      row: rowNum, 
      field, 
      message: 'Invalid date format',
      value 
    });
    return null;
  }
  
  return formatDateISO(date);
}

/**
 * Assign IDs to imported tasks
 */
export function assignTaskIds(tasks: Task[], existingTaskIds: string[]): Task[] {
  let nextId = 1;
  
  // Find the highest task number
  existingTaskIds.forEach(id => {
    const match = id.match(/TASK-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= nextId) {
        nextId = num + 1;
      }
    }
  });
  
  return tasks.map(task => {
    if (task.id) {
      // Check if ID already exists
      if (existingTaskIds.includes(task.id)) {
        // Generate new ID
        const newId = `TASK-${String(nextId).padStart(3, '0')}`;
        nextId++;
        return { ...task, id: newId };
      }
      return task;
    } else {
      // Generate new ID
      const newId = `TASK-${String(nextId).padStart(3, '0')}`;
      nextId++;
      return { ...task, id: newId };
    }
  });
}

/**
 * Validate imported tasks against existing data
 */
export function validateImportedTasks(
  tasks: Task[],
  existingDeveloperIds: string[]
): { validTasks: Task[]; warnings: ImportWarning[] } {
  const validTasks: Task[] = [];
  const warnings: ImportWarning[] = [];
  
  tasks.forEach((task, index) => {
    const rowNum = index + 1;
    
    // Check if assigned developer exists
    if (task.assignedDeveloperId && !existingDeveloperIds.includes(task.assignedDeveloperId)) {
      warnings.push({
        row: rowNum,
        field: 'assignedDeveloperId',
        message: `Developer ID "${task.assignedDeveloperId}" not found, task will be added to backlog`,
        value: task.assignedDeveloperId,
      });
      validTasks.push({ ...task, assignedDeveloperId: null });
    } else {
      validTasks.push(task);
    }
  });
  
  return { validTasks, warnings };
}

/**
 * Create a template Excel file for import
 */
export function createImportTemplate(): void {
  const headers = [
    'Task ID',
    'Task Title',
    'Project',
    'Jira URL',
    'Hours',
    'Start Date',
    'End Date',
    'Assigned Developer ID',
  ];
  
  const sampleData = [
    [
      'TASK-001',
      'Requirements Analysis',
      'Tres Health',
      'https://jira.company.com/browse/TH-101',
      40,
      '2026-01-05',
      '2026-01-09',
      'DEV-001',
    ],
    [
      '',
      'UI Development',
      'Tres Health',
      'https://jira.company.com/browse/TH-102',
      120,
      '2026-01-12',
      '2026-01-30',
      'DEV-001',
    ],
    [
      'TASK-003',
      'Backend Development',
      'Shopmool',
      '',
      160,
      '2026-02-02',
      '2026-02-27',
      '',
    ],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Task ID
    { wch: 30 }, // Task Title
    { wch: 20 }, // Project
    { wch: 40 }, // Jira URL
    { wch: 10 }, // Hours
    { wch: 12 }, // Start Date
    { wch: 12 }, // End Date
    { wch: 20 }, // Assigned Developer ID
  ];
  
  XLSX.writeFile(workbook, 'task_import_template.xlsx');
}
