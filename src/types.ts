export interface Task {
  id: string;
  title: string;
  project: string;
  jiraUrl: string;
  hours: number;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string; // ISO format YYYY-MM-DD (calculated)
  assignedDeveloperId: string | null; // null means in backlog
}

export interface Developer {
  id: string;
  name: string;
  color: string;
}

export interface MonthColumn {
  year: number;
  month: number;
  label: string;
  shortLabel: string;
}

export interface ProcessedTask extends Task {
  developerId: string | null;
  developerName: string | null;
  developerColor: string | null;
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
  assignedTasks: number;
  backlogTasks: number;
  totalHours: number;
  backlogHours: number;
  projectStart: Date | null;
  projectEnd: Date | null;
}

export interface BacklogSummary {
  totalTasks: number;
  totalHours: number;
  totalProjects: number;
}

export interface AppState {
  workingHoursPerDay: number;
  developers: Developer[];
  tasks: Task[];
  projects: string[];
}
