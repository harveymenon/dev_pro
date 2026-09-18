// Supabase storage utility functions
import { supabase, isSupabaseEnabled } from './supabaseClient';
import { Developer, Task } from '../types';

/**
 * Fetch all developers with their tasks from Supabase
 */
export async function fetchDevelopers(): Promise<Developer[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty array');
    return [];
  }

  try {
    // Fetch all developers
    const { data: developers, error: devError } = await supabase
      .from('developers')
      .select('*')
      .order('created_at', { ascending: true });

    if (devError) {
      console.error('Error fetching developers:', devError);
      return [];
    }

    if (!developers || developers.length === 0) {
      return [];
    }

    // Fetch all tasks
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (taskError) {
      console.error('Error fetching tasks:', taskError);
      return [];
    }

    // Map tasks to developers
    const developerMap = new Map<string, Developer>();
    
    developers.forEach((dev: any) => {
      developerMap.set(dev.id, {
        id: dev.id,
        name: dev.name,
        color: dev.color,
        tasks: [],
      });
    });

    tasks?.forEach((task: any) => {
      const developer = developerMap.get(task.developer_id);
      if (developer) {
        developer.tasks.push({
          id: task.id,
          title: task.title,
          hours: task.hours,
          startDate: task.start_date,
          endDate: task.end_date,
        });
      }
    });

    return Array.from(developerMap.values());
  } catch (error) {
    console.error('Error in fetchDevelopers:', error);
    return [];
  }
}

/**
 * Save developers to Supabase
 * This will sync the entire state with the database
 */
export async function saveDevelopers(developers: Developer[]): Promise<void> {
  console.log('💾 Attempting to save developers to Supabase...');
  console.log('  - Supabase client:', supabase ? '✓ Available' : '✗ Not available');
  console.log('  - Developers count:', developers.length);
  
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping save');
    return;
  }

  try {
    // Get current developers from database
    const { data: existingDevelopers } = await supabase
      .from('developers')
      .select('id');

    const existingIds = new Set(existingDevelopers?.map((d: any) => d.id) || []);
    const currentIds = new Set(developers.map(d => d.id));

    // Delete developers that no longer exist
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
        // Update existing developer
        await supabase
          .from('developers')
          .update({
            name: dev.name,
            color: dev.color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dev.id);
      } else {
        // Insert new developer
        await supabase
          .from('developers')
          .insert({
            id: dev.id,
            name: dev.name,
            color: dev.color,
          });
      }

      // Sync tasks for this developer
      await syncDeveloperTasks(dev.id, dev.tasks);
    }
  } catch (error) {
    console.error('Error in saveDevelopers:', error);
  }
}

/**
 * Sync tasks for a specific developer
 */
async function syncDeveloperTasks(developerId: string, tasks: Task[]): Promise<void> {
  if (!supabase) return;

  try {
    // Get current tasks for this developer
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('developer_id', developerId);

    const existingIds = new Set(existingTasks?.map((t: any) => t.id) || []);
    const currentIds = new Set(tasks.map(t => t.id));

    // Delete tasks that no longer exist
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
        // Update existing task
        await supabase
          .from('tasks')
          .update({
            title: task.title,
            hours: task.hours,
            start_date: task.startDate,
            end_date: task.endDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id);
      } else {
        // Insert new task
        await supabase
          .from('tasks')
          .insert({
            id: task.id,
            developer_id: developerId,
            title: task.title,
            hours: task.hours,
            start_date: task.startDate,
            end_date: task.endDate,
          });
      }
    }
  } catch (error) {
    console.error('Error in syncDeveloperTasks:', error);
  }
}

/**
 * Fetch working hours per day from Supabase
 */
export async function fetchWorkingHours(): Promise<number> {
  if (!supabase) {
    return 8; // Default value
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'working_hours_per_day')
      .single();

    if (error || !data) {
      return 8; // Default value
    }

    const hours = parseInt(data.value, 10);
    return isNaN(hours) ? 8 : hours;
  } catch (error) {
    console.error('Error fetching working hours:', error);
    return 8; // Default value
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
 * Fetch active tab from Supabase
 */
export async function fetchActiveTab(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'active_tab')
      .single();

    if (error || !data) {
      return null;
    }

    return data.value;
  } catch (error) {
    console.error('Error fetching active tab:', error);
    return null;
  }
}

/**
 * Save active tab to Supabase
 */
export async function saveActiveTab(tabId: string): Promise<void> {
  console.log('💾 Attempting to save active tab:', tabId);
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping save');
    return;
  }

  try {
    const { data: existing } = await supabase
      .from('settings')
      .select('key')
      .eq('key', 'active_tab')
      .single();

    if (existing) {
      await supabase
        .from('settings')
        .update({
          value: tabId,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'active_tab');
    } else {
      await supabase
        .from('settings')
        .insert({
          key: 'active_tab',
          value: tabId,
        });
    }
  } catch (error) {
    console.error('Error saving active tab:', error);
  }
}

/**
 * Clear all data from Supabase
 */
export async function clearAllData(): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('tasks').delete().neq('id', '');
    await supabase.from('developers').delete().neq('id', '');
    await supabase.from('settings').delete().neq('key', '');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return isSupabaseEnabled;
}
