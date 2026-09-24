export interface Task {
  id: string;
  title: string;
  project: string;
  jiraUrl: string;
  hours: number;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string; // ISO format YYYY-MM-DD (calculated)
  assignedDeveloperId: string | null; // null means in backlog
  priority?: 'Low' | 'Medium' | 'High' | 'Highest';
  status?: 'Backlog' | 'Ready' | 'In Progress' | 'In UAT' | 'Done';
  reporter?: string;
  resolution?: 'Unresolved' | 'Fixed' | 'Won\'t Fix' | 'Duplicate';
  created?: string; // ISO date string
  sortOrder?: number; // Order within developer's board
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
  standardWeeklyHours: number;
  developers: Developer[];
  tasks: Task[];
  timesheetEntries: TimesheetEntry[];
  projects: string[];
}

export interface TimesheetEntry {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  taskId: string;
  taskTitle: string;
  hoursSpent: number;
  portal: string;
  environment: 'DEV' | 'UAT' | 'PROD' | 'Other';
  description: string;
  developerId: string;
  developerName: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  month: number;
  year: number;
  importedAt: string;
}

export interface WeeklySummary {
  developerId: string;
  developerName: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  totalHours: number;
  taskCount: number;
  uniqueTasks: number;
  avgHoursPerTask: number;
  utilization: number;
  tasks: TimesheetEntry[];
}

export interface DeveloperPerformance {
  developerId: string;
  developerName: string;
  totalHours: number;
  totalTasks: number;
  avgHoursPerTask: number;
  avgUtilization: number;
  weeks: WeeklySummary[];
  projectDistribution: { [project: string]: number };
  environmentDistribution: { [env: string]: number };
}

export interface DashboardKPIs {
  totalDevelopers: number;
  totalHours: number;
  avgHoursPerDeveloper: number;
  totalTasks: number;
  avgWeeklyHours: number;
  overallUtilization: number;
  hoursThisWeek: number;
  hoursLastWeek: number;
}
