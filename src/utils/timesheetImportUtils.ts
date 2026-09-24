// Timesheet import utility functions
import * as XLSX from 'xlsx';
import { TimesheetEntry } from '../types';
import { generateTimesheetEntryId, calculateDerivedFields } from './timesheetUtils';

export interface TimesheetImportResult {
  success: boolean;
  entries: TimesheetEntry[];
  errors: TimesheetImportError[];
  warnings: TimesheetImportWarning[];
  summary: {
    totalRows: number;
    validRows: number;
    duplicateRows: number;
  };
}

export interface TimesheetImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface TimesheetImportWarning {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface TimesheetImportPreview {
  entries: TimesheetEntry[];
  errors: TimesheetImportError[];
  warnings: TimesheetImportWarning[];
  totalRows: number;
  validRows: number;
  duplicateRows: number;
}

/**
 * Parse a timesheet Excel file and extract entries
 */
export async function parseTimesheetExcel(
  file: File,
  existingEntryIds: Set<string>
): Promise<TimesheetImportPreview> {
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
            entries: [],
            errors: [{ row: 0, field: 'file', message: 'Excel file is empty' }],
            warnings: [],
            totalRows: 0,
            validRows: 0,
            duplicateRows: 0,
          });
          return;
        }
        
        // Find header row
        const headers = jsonData[0] as string[];
        const headerMap = createTimesheetHeaderMap(headers);
        
        // Parse data rows
        const entries: TimesheetEntry[] = [];
        const errors: TimesheetImportError[] = [];
        const warnings: TimesheetImportWarning[] = [];
        const seenIds = new Set<string>();
        let duplicateCount = 0;
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;
          
          const rowNum = i + 1; // Excel row number (1-indexed, +1 for header)
          const entryResult = parseTimesheetRow(row, headerMap, rowNum, existingEntryIds, seenIds);
          
          if (entryResult.errors.length > 0) {
            errors.push(...entryResult.errors);
          } else if (entryResult.entry) {
            // Check for duplicates
            const entryKey = `${entryResult.entry.date}-${entryResult.entry.taskId}-${entryResult.entry.developerId}`;
            if (seenIds.has(entryKey)) {
              duplicateCount++;
              warnings.push({
                row: rowNum,
                field: 'duplicate',
                message: `Duplicate entry detected: ${entryResult.entry.taskTitle} on ${entryResult.entry.date}`,
                value: entryKey,
              });
            } else {
              seenIds.add(entryKey);
              if (entryResult.warnings.length > 0) {
                warnings.push(...entryResult.warnings);
              }
              entries.push(entryResult.entry);
            }
          }
        }
        
        console.log('✅ Timesheet parsing complete:', {
          totalRows: jsonData.length - 1,
          validEntries: entries.length,
          errors: errors.length,
          warnings: warnings.length,
          duplicates: duplicateCount,
        });
        
        resolve({
          entries,
          errors,
          warnings,
          totalRows: jsonData.length - 1,
          validRows: entries.length,
          duplicateRows: duplicateCount,
        });
      } catch (error) {
        resolve({
          entries: [],
          errors: [{ row: 0, field: 'file', message: `Failed to parse Excel file: ${error}` }],
          warnings: [],
          totalRows: 0,
          validRows: 0,
          duplicateRows: 0,
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        entries: [],
        errors: [{ row: 0, field: 'file', message: 'Failed to read file' }],
        warnings: [],
        totalRows: 0,
        validRows: 0,
        duplicateRows: 0,
      });
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Create a mapping of column names to indices for timesheet data
 */
function createTimesheetHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  
  headers.forEach((header, index) => {
    if (!header) return;
    
    const normalizedHeader = header.toLowerCase().trim();
    
    // Map common variations to standard field names
    if (normalizedHeader.includes('date') && !normalizedHeader.includes('import')) {
      map.set('date', index);
    } else if (normalizedHeader === 'id' || normalizedHeader.includes('task id') || normalizedHeader.includes('jira')) {
      map.set('taskId', index);
    } else if (normalizedHeader.includes('hrs spent') || normalizedHeader.includes('hours spent') || normalizedHeader === 'hours') {
      map.set('hoursSpent', index);
    } else if (normalizedHeader.includes('portal') || normalizedHeader.includes('related portal')) {
      map.set('portal', index);
    } else if (normalizedHeader.includes('environment')) {
      map.set('environment', index);
    } else if (normalizedHeader.includes('title') && !normalizedHeader.includes('hrs')) {
      map.set('taskTitle', index);
    } else if (normalizedHeader.includes('description')) {
      map.set('description', index);
    } else if (normalizedHeader.includes('developer') || normalizedHeader.includes('assignee')) {
      map.set('developerName', index);
    }
  });
  
  return map;
}

/**
 * Parse a single row into a TimesheetEntry object
 */
function parseTimesheetRow(
  row: any[],
  headerMap: Map<string, number>,
  rowNum: number,
  existingEntryIds: Set<string>,
  seenIds: Set<string>
): { entry?: TimesheetEntry; errors: TimesheetImportError[]; warnings: TimesheetImportWarning[] } {
  const errors: TimesheetImportError[] = [];
  const warnings: TimesheetImportWarning[] = [];
  
  // Get values from row
  const getDate = () => getCellValue(row, headerMap.get('date'));
  const getTaskId = () => getCellValue(row, headerMap.get('taskId'));
  const getHoursSpent = () => getCellValue(row, headerMap.get('hoursSpent'));
  const getPortal = () => getCellValue(row, headerMap.get('portal'));
  const getEnvironment = () => getCellValue(row, headerMap.get('environment'));
  const getTaskTitle = () => getCellValue(row, headerMap.get('taskTitle'));
  const getDescription = () => getCellValue(row, headerMap.get('description'));
  const getDeveloperName = () => getCellValue(row, headerMap.get('developerName'));
  
  // Validate required fields
  const date = getDate();
  if (!date) {
    errors.push({ row: rowNum, field: 'date', message: 'Date is required' });
    return { errors, warnings };
  }
  
  const taskId = getTaskId();
  if (!taskId) {
    errors.push({ row: rowNum, field: 'taskId', message: 'Task ID is required' });
    return { errors, warnings };
  }
  
  const hoursSpentStr = getHoursSpent();
  if (!hoursSpentStr) {
    errors.push({ row: rowNum, field: 'hoursSpent', message: 'Hours spent is required' });
    return { errors, warnings };
  }
  
  const developerName = getDeveloperName();
  if (!developerName) {
    errors.push({ row: rowNum, field: 'developerName', message: 'Developer name is required' });
    return { errors, warnings };
  }
  
  // Parse and validate fields
  const dateISO = parseDate(date, rowNum, 'date', errors);
  if (!dateISO) {
    return { errors, warnings };
  }
  
  const hoursSpent = parseFloat(hoursSpentStr);
  if (isNaN(hoursSpent)) {
    errors.push({ 
      row: rowNum, 
      field: 'hoursSpent', 
      message: 'Invalid hours value',
      value: hoursSpentStr 
    });
    return { errors, warnings };
  }
  
  if (hoursSpent < 0) {
    errors.push({ 
      row: rowNum, 
      field: 'hoursSpent', 
      message: 'Hours cannot be negative',
      value: hoursSpent 
    });
    return { errors, warnings };
  }
  
  if (hoursSpent > 24) {
    warnings.push({ 
      row: rowNum, 
      field: 'hoursSpent', 
      message: 'Hours spent exceeds 24 hours in a day',
      value: hoursSpent 
    });
  }
  
  const taskTitle = getTaskTitle() || 'Unknown Task';
  const portal = getPortal() || '';
  const environment = normalizeEnvironment(getEnvironment());
  const description = getDescription() || '';
  
  // Generate developer ID from name (simple hash)
  const developerId = generateDeveloperId(developerName);
  
  // Create base entry
  const baseEntry = {
    id: generateTimesheetEntryId(),
    date: dateISO,
    taskId,
    taskTitle,
    hoursSpent,
    portal,
    environment,
    description,
    developerId,
    developerName,
    importedAt: new Date().toISOString(),
  };
  
  // Calculate derived fields
  const entry = calculateDerivedFields(baseEntry);
  
  return { entry, errors, warnings };
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
 * Parse date value to ISO format
 */
function parseDate(
  value: string,
  rowNum: number,
  field: string,
  errors: TimesheetImportError[]
): string | null {
  if (!value) return null;
  
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
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalize environment value
 */
function normalizeEnvironment(value: string): 'DEV' | 'UAT' | 'PROD' | 'Other' {
  const normalized = value.toUpperCase().trim();
  if (normalized.includes('DEV') || normalized.includes('DEVELOPMENT')) return 'DEV';
  if (normalized.includes('UAT') || normalized.includes('TEST')) return 'UAT';
  if (normalized.includes('PROD') || normalized.includes('PRODUCTION')) return 'PROD';
  return 'Other';
}

/**
 * Generate a simple developer ID from name
 */
function generateDeveloperId(name: string): string {
  // Simple hash function to generate consistent ID from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `DEV-${Math.abs(hash).toString(36).toUpperCase()}`;
}

/**
 * Create a template Excel file for timesheet import
 */
export function createTimesheetImportTemplate(): void {
  const headers = [
    'Date',
    'ID',
    'HRS SPENT',
    'Related Portal(s)',
    'Environment(s)',
    'TITLE (Hrs)',
    'Description',
    'Developer',
  ];
  
  const sampleData = [
    [
      '2026-01-05',
      'TASK-001',
      6,
      'Tres Health',
      'DEV',
      'Requirements Analysis',
      'Initial requirements gathering and documentation',
      'John Doe',
    ],
    [
      '2026-01-05',
      'TASK-002',
      2,
      'Tres Health',
      'DEV',
      'UI Development',
      'Created wireframes for login page',
      'John Doe',
    ],
    [
      '2026-01-06',
      'TASK-001',
      4,
      'Tres Health',
      'DEV',
      'Requirements Analysis',
      'Reviewed requirements with stakeholders',
      'John Doe',
    ],
    [
      '2026-01-06',
      'TASK-003',
      3,
      'Shopmool',
      'UAT',
      'Backend Development',
      'Fixed API endpoint issues in UAT',
      'Jane Smith',
    ],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet');
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 15 }, // ID
    { wch: 12 }, // HRS SPENT
    { wch: 20 }, // Related Portal(s)
    { wch: 15 }, // Environment(s)
    { wch: 30 }, // TITLE (Hrs)
    { wch: 40 }, // Description
    { wch: 20 }, // Developer
  ];
  
  XLSX.writeFile(workbook, 'timesheet_import_template.xlsx');
}
