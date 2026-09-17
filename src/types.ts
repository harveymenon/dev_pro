export interface Task {
  id: string;
  title: string;
  hours: number;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string; // ISO format YYYY-MM-DD (calculated)
  color: string;
}

export interface MonthColumn {
  year: number;
  month: number;
  label: string;
}
