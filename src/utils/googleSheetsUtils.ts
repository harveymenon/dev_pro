// Google Sheets API integration for timesheet import
import { TimesheetEntry } from '../types';
import { generateTimesheetEntryId, calculateDerivedFields } from './timesheetUtils';

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
}

export interface SheetData {
  sheetName: string;
  headers: string[];
  rows: any[][];
}

export interface GoogleSheetsImportResult {
  success: boolean;
  entries: TimesheetEntry[];
  errors: string[];
  warnings: string[];
  sheetsProcessed: number;
}

/**
 * Fetch data from Google Sheets
 */
export async function fetchGoogleSheetData(
  spreadsheetId: string,
  sheetName: string,
  apiKey: string
): Promise<SheetData> {
  // URL-encode the sheet name to handle spaces and special characters
  const encodedSheetName = encodeURIComponent(sheetName);
  const range = `${encodedSheetName}!A1:Z1000`; // Fetch up to 1000 rows
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  console.log(`📊 Fetching data from sheet: "${sheetName}"`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Failed to fetch sheet "${sheetName}":`, error);
      throw new Error(error.error?.message || 'Failed to fetch sheet data');
    }

    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      console.log(`⚠️ Sheet "${sheetName}" is empty or has no data rows`);
      return {
        sheetName,
        headers: [],
        rows: [],
      };
    }

    const headers = data.values[0] as string[];
    const rows = data.values.slice(1) as any[][];

    console.log(`✅ Successfully fetched ${rows.length} rows from sheet "${sheetName}"`);

    return {
      sheetName,
      headers,
      rows,
    };
  } catch (error) {
    console.error(`❌ Error fetching Google Sheet "${sheetName}":`, error);
    throw error;
  }
}

/**
 * List all sheets in a spreadsheet
 */
export async function listGoogleSheets(
  spreadsheetId: string,
  apiKey: string
): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to list sheets');
    }

    const data = await response.json();
    const sheets = data.sheets.map((sheet: any) => sheet.properties.title);
    
    return sheets;
  } catch (error) {
    console.error('Error listing Google Sheets:', error);
    throw error;
  }
}

/**
 * Parse Google Sheet data into timesheet entries
 */
export function parseGoogleSheetData(
  sheetData: SheetData,
  developerName: string
): { entries: TimesheetEntry[]; errors: string[]; warnings: string[] } {
  const entries: TimesheetEntry[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (sheetData.rows.length === 0) {
    warnings.push(`Sheet "${sheetData.sheetName}" is empty`);
    return { entries, errors, warnings };
  }

  // Create header map
  const headerMap = createHeaderMap(sheetData.headers);

  // Validate required columns
  const requiredColumns = ['date', 'taskId', 'hoursSpent'];
  const missingColumns = requiredColumns.filter(col => !headerMap.has(col));
  
  if (missingColumns.length > 0) {
    errors.push(`Sheet "${sheetData.sheetName}" missing required columns: ${missingColumns.join(', ')}`);
    return { entries, errors, warnings };
  }

  // Parse each row
  sheetData.rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because row 1 is header and index is 0-based
    
    try {
      const entry = parseRow(row, headerMap, rowNum, developerName);
      if (entry) {
        entries.push(entry);
      }
    } catch (error) {
      errors.push(`Row ${rowNum} in sheet "${sheetData.sheetName}": ${error}`);
    }
  });

  return { entries, errors, warnings };
}

/**
 * Create header map from sheet headers
 */
function createHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  
  headers.forEach((header, index) => {
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
    }
  });
  
  return map;
}

/**
 * Parse a single row into a TimesheetEntry
 */
function parseRow(
  row: any[],
  headerMap: Map<string, number>,
  rowNum: number,
  developerName: string
): TimesheetEntry | null {
  // Get cell values
  const getCellValue = (field: string): string => {
    const index = headerMap.get(field);
    if (index === undefined || index >= row.length) return '';
    const value = row[index];
    return value ? String(value).trim() : '';
  };

  // Validate required fields
  const date = getCellValue('date');
  if (!date) {
    throw new Error('Date is required');
  }

  const taskId = getCellValue('taskId');
  if (!taskId) {
    throw new Error('Task ID is required');
  }

  const hoursSpentStr = getCellValue('hoursSpent');
  if (!hoursSpentStr) {
    throw new Error('Hours spent is required');
  }

  // Parse and validate fields
  const dateISO = parseDate(date);
  if (!dateISO) {
    throw new Error(`Invalid date format: ${date}`);
  }

  const hoursSpent = parseFloat(hoursSpentStr);
  if (isNaN(hoursSpent)) {
    throw new Error(`Invalid hours value: ${hoursSpentStr}`);
  }

  if (hoursSpent < 0) {
    throw new Error('Hours cannot be negative');
  }

  if (hoursSpent > 24) {
    console.warn(`Row ${rowNum}: Hours spent (${hoursSpent}) exceeds 24 hours`);
  }

  const taskTitle = getCellValue('taskTitle') || 'Unknown Task';
  const portal = getCellValue('portal') || '';
  const environment = normalizeEnvironment(getCellValue('environment'));
  const description = getCellValue('description') || '';

  // Generate developer ID from name
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
  return calculateDerivedFields(baseEntry);
}

/**
 * Parse date string to ISO format
 */
function parseDate(value: string): string | null {
  if (!value) return null;

  let date: Date | null = null;

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date = new Date(value);
  }
  // Try MM/DD/YYYY
  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    const parts = value.split('/');
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
    date = new Date((excelDate - 25569) * 86400 * 1000);
  }
  // Try general date parsing
  else {
    date = new Date(value);
  }

  if (!date || isNaN(date.getTime())) {
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
 * Generate developer ID from name
 */
function generateDeveloperId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `DEV-${Math.abs(hash).toString(36).toUpperCase()}`;
}

/**
 * Import all sheets from Google Spreadsheet
 * Each sheet represents a developer
 */
export async function importFromGoogleSheets(
  spreadsheetId: string,
  apiKey: string
): Promise<GoogleSheetsImportResult> {
  const allEntries: TimesheetEntry[] = [];
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  let sheetsProcessed = 0;

  try {
    console.log('🚀 Starting Google Sheets import...');
    
    // List all sheets
    const sheetNames = await listGoogleSheets(spreadsheetId, apiKey);
    console.log(`📋 Found ${sheetNames.length} sheet(s):`, sheetNames);
    
    // Skip system sheets
    const developerSheets = sheetNames.filter(name => !name.startsWith('System'));
    console.log(`👥 Processing ${developerSheets.length} developer sheet(s):`, developerSheets);

    // Process each sheet
    for (let i = 0; i < developerSheets.length; i++) {
      const sheetName = developerSheets[i];
      console.log(`\n📄 Processing sheet ${i + 1}/${developerSheets.length}: "${sheetName}"`);
      
      try {
        // Fetch sheet data
        const sheetData = await fetchGoogleSheetData(spreadsheetId, sheetName, apiKey);
        
        // The sheet name is the developer name
        const developerName = sheetName;
        
        // Parse sheet data
        const { entries, errors, warnings } = parseGoogleSheetData(sheetData, developerName);
        
        console.log(`✅ Sheet "${sheetName}": ${entries.length} entries, ${errors.length} errors, ${warnings.length} warnings`);
        
        allEntries.push(...entries);
        allErrors.push(...errors);
        allWarnings.push(...warnings);
        sheetsProcessed++;
        
      } catch (error) {
        console.error(`❌ Failed to process sheet "${sheetName}":`, error);
        allErrors.push(`Failed to process sheet "${sheetName}": ${error}`);
      }
    }

    console.log(`\n🎉 Import complete! Processed ${sheetsProcessed} sheet(s), ${allEntries.length} total entries`);

    return {
      success: allErrors.length === 0,
      entries: allEntries,
      errors: allErrors,
      warnings: allWarnings,
      sheetsProcessed,
    };

  } catch (error) {
    console.error('❌ Import failed:', error);
    return {
      success: false,
      entries: [],
      errors: [`Failed to import from Google Sheets: ${error}`],
      warnings: [],
      sheetsProcessed: 0,
    };
  }
}

/**
 * Validate Google Sheets API key
 */
export async function validateGoogleSheetsAccess(
  spreadsheetId: string,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    await listGoogleSheets(spreadsheetId, apiKey);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid API key or spreadsheet ID' 
    };
  }
}
