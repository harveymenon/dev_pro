export interface Task {
  id: string;
  title: string;
  hours: number;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string; // ISO format YYYY-MM-DD (calculated)
}

export interface Developer {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

export interface MonthColumn {
  year: number;
  month: number;
  label: string;
  shortLabel: string;
}

export interface ProcessedTask extends Task {
  developerId: string;
  developerName: string;
  developerColor: string;
  startDateObj: Date;
  endDateObj: Date;
  workingDays: number;
}

export interface DeveloperSummary {
  totalTasks: number;
  totalHours: number;
  totalWorkingDays: number;
  projectStart: Date | null;
  projectEnd: Date | null;
}

export interface ProjectSummary {
  totalDevelopers: number;
  totalTasks: number;
  totalHours: number;
  projectStart: Date | null;
  projectEnd: Date | null;
}
