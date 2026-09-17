// localStorage utility functions
import { Developer } from '../types';

const STORAGE_KEY_DEVELOPERS = 'gantt_developers';
const STORAGE_KEY_WORKING_HOURS = 'gantt_working_hours';
const STORAGE_KEY_ACTIVE_TAB = 'gantt_active_tab';

/**
 * Save developers to localStorage
 */
export function saveDevelopers(developers: Developer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEVELOPERS, JSON.stringify(developers));
  } catch (e) {
    console.error('Failed to save developers to localStorage:', e);
  }
}

/**
 * Load developers from localStorage
 */
export function loadDevelopers(): Developer[] | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DEVELOPERS);
    if (data) {
      return JSON.parse(data) as Developer[];
    }
  } catch (e) {
    console.error('Failed to load developers from localStorage:', e);
  }
  return null;
}

/**
 * Save working hours per day to localStorage
 */
export function saveWorkingHours(hours: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_WORKING_HOURS, String(hours));
  } catch (e) {
    console.error('Failed to save working hours to localStorage:', e);
  }
}

/**
 * Load working hours per day from localStorage
 */
export function loadWorkingHours(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY_WORKING_HOURS);
    if (data) {
      const hours = parseInt(data, 10);
      if (!isNaN(hours) && hours > 0 && hours <= 24) {
        return hours;
      }
    }
  } catch (e) {
    console.error('Failed to load working hours from localStorage:', e);
  }
  return 8; // Default
}

/**
 * Save active tab to localStorage
 */
export function saveActiveTab(tabId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, tabId);
  } catch (e) {
    console.error('Failed to save active tab to localStorage:', e);
  }
}

/**
 * Load active tab from localStorage
 */
export function loadActiveTab(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_TAB);
  } catch (e) {
    console.error('Failed to load active tab from localStorage:', e);
  }
  return null;
}

/**
 * Clear all application data from localStorage
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DEVELOPERS);
    localStorage.removeItem(STORAGE_KEY_WORKING_HOURS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_TAB);
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
