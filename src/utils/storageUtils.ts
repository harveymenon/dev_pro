// Supabase storage utility functions for centralized task architecture
import { supabase, isSupabaseEnabled } from './supabaseClient';
import { Developer, Task, AppState } from '../types';

/**
 * Fetch complete app state from Supabase
 */
export async function fetchAppState(): Promise<AppState | null> {
  console.log('📡 Fetching app state from Supabase...');
  
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, returning null');
    return null;
  }

  try {
    // Fetch developers
    console.log('📡 Fetching developers...');
    const { data: developers, error: devError } = await supabase
      .from('developers')
      .select('*')
      .order('created_at', { ascending: true });

    if (devError) {
      console.error('❌ Error fetching developers:', devError);
      return null;
    }
    console.log('✅ Fetched', developers?.length || 0, 'developers');

    // Fetch tasks
    console.log('📡 Fetching tasks...');
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (taskError) {
      console.error('❌ Error fetching tasks:', taskError);
      return null;
    }
    console.log('✅ Fetched', tasks?.length || 0, 'tasks');

    // Fetch settings
    console.log('📡 Fetching settings...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*');

    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError);
      return null;
    }
    console.log('✅ Fetched settings:', settingsData?.length || 0, 'entries');

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

    const appState = {
      workingHoursPerDay: parseInt(workingHoursPerDay, 10),
      developers: developers || [],
      tasks: transformedTasks,
      projects: JSON.parse(projectsData),
    };

    console.log('✅ App state fetched successfully:', {
      developers: appState.developers.length,
      tasks: appState.tasks.length,
      projects: appState.projects.length,
      workingHoursPerDay: appState.workingHoursPerDay
    });

    return appState;
  } catch (error) {
    console.error('❌ Error in fetchAppState:', error);
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
  console.log('  - Working Hours:', appState.workingHoursPerDay);
  console.log('  - Projects:', appState.projects.length);

  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping save');
    return;
  }

  try {
    console.log('🔄 Saving developers...');
    await saveDevelopers(appState.developers);

    console.log('🔄 Saving tasks...');
    await saveTasks(appState.tasks);

    console.log('🔄 Saving settings...');
    await saveWorkingHours(appState.workingHoursPerDay);
    await saveProjects(appState.projects);

    console.log('✅ App state saved successfully to Supabase');
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
  console.log('💾 Saving tasks to Supabase...', tasks.length, 'tasks');
  
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping task save');
    return;
  }

  try {
    // Get current tasks
    const { data: existingTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id');

    if (fetchError) {
      console.error('❌ Error fetching existing tasks:', fetchError);
      return;
    }

    const existingIds = new Set(existingTasks?.map((t: any) => t.id) || []);
    const currentIds = new Set(tasks.map(t => t.id));

    console.log('📊 Existing tasks:', existingIds.size, 'Current tasks:', currentIds.size);

    // Delete removed tasks
    const toDelete = Array.from(existingIds).filter(id => !currentIds.has(id));
    if (toDelete.length > 0) {
      console.log('🗑️ Deleting', toDelete.length, 'removed tasks');
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .in('id', toDelete);
      
      if (deleteError) {
        console.error('❌ Error deleting tasks:', deleteError);
      }
    }

    // Upsert tasks
    let inserted = 0;
    let updated = 0;
    
    for (const task of tasks) {
      // For backward compatibility, also set developer_id
      // Use assigned_developer_id if available, otherwise use empty string
      // This ensures we never send null to a NOT NULL column
      const developerId = task.assignedDeveloperId || '';
      
      if (existingIds.has(task.id)) {
        const updateData: any = {
          title: task.title,
          project: task.project || '',
          jira_url: task.jiraUrl || '',
          hours: task.hours || 0,
          start_date: task.startDate,
          end_date: task.endDate,
          assigned_developer_id: task.assignedDeveloperId,
          developer_id: developerId, // backward compatibility
          updated_at: new Date().toISOString(),
        };
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', task.id);
        
        if (updateError) {
          console.error('❌ Error updating task', task.id, ':', updateError);
        } else {
          updated++;
        }
      } else {
        const insertData: any = {
          id: task.id,
          title: task.title,
          project: task.project || '',
          jira_url: task.jiraUrl || '',
          hours: task.hours || 0,
          start_date: task.startDate,
          end_date: task.endDate,
          assigned_developer_id: task.assignedDeveloperId,
          developer_id: developerId, // backward compatibility
        };
        
        const { error: insertError } = await supabase
          .from('tasks')
          .insert(insertData);
        
        if (insertError) {
          console.error('❌ Error inserting task', task.id, ':', insertError);
        } else {
          inserted++;
        }
      }
    }
    
    console.log('✅ Tasks saved successfully - Inserted:', inserted, 'Updated:', updated);
  } catch (error) {
    console.error('❌ Error in saveTasks:', error);
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
