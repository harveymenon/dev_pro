// Supabase storage utility functions for centralized task architecture
import { supabase, isSupabaseEnabled } from './supabaseClient';
import { Developer, Task, AppState } from '../types';

/**
 * Fetch complete app state from Supabase
 */
export async function fetchAppState(): Promise<AppState | null> {
  if (!supabase) {
    console.warn('Supabase not configured, returning null');
    return null;
  }

  try {
    // Fetch developers
    const { data: developers, error: devError } = await supabase
      .from('developers')
      .select('*')
      .order('created_at', { ascending: true });

    if (devError) {
      console.error('Error fetching developers:', devError);
      return null;
    }

    // Fetch tasks
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (taskError) {
      console.error('Error fetching tasks:', taskError);
      return null;
    }

    // Fetch settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*');

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return null;
    }

    // Parse settings
    const workingHoursPerDay = settingsData?.find(s => s.key === 'working_hours_per_day')?.value || '8';
    const projectsData = settingsData?.find(s => s.key === 'projects')?.value || '[]';

    // Transform tasks from Supabase format to app format
    const transformedTasks: Task[] = (tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title || 'Untitled Task',
      project: task.project || '',
      jiraUrl: task.jira_url || '',
      hours: task.hours || 0,
      startDate: task.start_date || new Date().toISOString().split('T')[0],
      endDate: task.end_date || new Date().toISOString().split('T')[0],
      assignedDeveloperId: task.assigned_developer_id || null,
    }));

    return {
      workingHoursPerDay: parseInt(workingHoursPerDay, 10),
      developers: developers || [],
      tasks: transformedTasks,
      projects: JSON.parse(projectsData),
    };
  } catch (error) {
    console.error('Error in fetchAppState:', error);
    return null;
  }
}

/**
 * Save complete app state to Supabase
 */
export async function saveAppState(appState: AppState): Promise<void> {
  console.log('💾 Attempting to save app state to Supabase...');
  console.log('  - Supabase client:', supabase ? '✓ Available' : '✗ Not available');
  console.log('  - Developers:', appState.developers.length);
  console.log('  - Tasks:', appState.tasks.length);

  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping save');
    return;
  }

  try {
    // Save developers
    await saveDevelopers(appState.developers);

    // Save tasks
    await saveTasks(appState.tasks);

    // Save settings
    await saveWorkingHours(appState.workingHoursPerDay);
    await saveProjects(appState.projects);

    console.log('✅ App state saved successfully');
  } catch (error) {
    console.error('❌ Error saving app state:', error);
  }
}

/**
 * Save developers to Supabase
 */
async function saveDevelopers(developers: Developer[]): Promise<void> {
  if (!supabase) return;

  try {
    // Get current developers
    const { data: existingDevelopers } = await supabase
      .from('developers')
      .select('id');

    const existingIds = new Set(existingDevelopers?.map((d: any) => d.id) || []);
    const currentIds = new Set(developers.map(d => d.id));

    // Delete removed developers
    const toDelete = Array.from(existingIds).filter(id => !currentIds.has(id));
    if (toDelete.length > 0) {
      await supabase
        .from('developers')
        .delete()
        .in('id', toDelete);
    }

    // Upsert developers
    for (const dev of developers) {
      if (existingIds.has(dev.id)) {
        await supabase
          .from('developers')
          .update({
            name: dev.name,
            color: dev.color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dev.id);
      } else {
        await supabase
          .from('developers')
          .insert({
            id: dev.id,
            name: dev.name,
            color: dev.color,
          });
      }
    }
  } catch (error) {
    console.error('Error saving developers:', error);
  }
}

/**
 * Save tasks to Supabase
 */
async function saveTasks(tasks: Task[]): Promise<void> {
  if (!supabase) return;

  try {
    // Get current tasks
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id');

    const existingIds = new Set(existingTasks?.map((t: any) => t.id) || []);
    const currentIds = new Set(tasks.map(t => t.id));

    // Delete removed tasks
    const toDelete = Array.from(existingIds).filter(id => !currentIds.has(id));
    if (toDelete.length > 0) {
      await supabase
        .from('tasks')
        .delete()
        .in('id', toDelete);
    }

    // Upsert tasks
    for (const task of tasks) {
      if (existingIds.has(task.id)) {
        await supabase
          .from('tasks')
          .update({
            title: task.title,
            project: task.project,
            jira_url: task.jiraUrl,
            hours: task.hours,
            start_date: task.startDate,
            end_date: task.endDate,
            assigned_developer_id: task.assignedDeveloperId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id);
      } else {
        await supabase
          .from('tasks')
          .insert({
            id: task.id,
            title: task.title,
            project: task.project,
            jira_url: task.jiraUrl,
            hours: task.hours,
            start_date: task.startDate,
            end_date: task.endDate,
            assigned_developer_id: task.assignedDeveloperId,
          });
      }
    }
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

/**
 * Save working hours per day to Supabase
 */
export async function saveWorkingHours(hours: number): Promise<void> {
  console.log('💾 Attempting to save working hours:', hours);
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping save');
    return;
  }

  try {
    const { data: existing } = await supabase
      .from('settings')
      .select('key')
      .eq('key', 'working_hours_per_day')
      .single();

    if (existing) {
      await supabase
        .from('settings')
        .update({
          value: String(hours),
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'working_hours_per_day');
    } else {
      await supabase
        .from('settings')
        .insert({
          key: 'working_hours_per_day',
          value: String(hours),
        });
    }
  } catch (error) {
    console.error('Error saving working hours:', error);
  }
}

/**
 * Save projects list to Supabase
 */
export async function saveProjects(projects: string[]): Promise<void> {
  if (!supabase) return;

  try {
    const { data: existing } = await supabase
      .from('settings')
      .select('key')
      .eq('key', 'projects')
      .single();

    if (existing) {
      await supabase
        .from('settings')
        .update({
          value: JSON.stringify(projects),
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'projects');
    } else {
      await supabase
        .from('settings')
        .insert({
          key: 'projects',
          value: JSON.stringify(projects),
        });
    }
  } catch (error) {
    console.error('Error saving projects:', error);
  }
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return isSupabaseEnabled;
}
