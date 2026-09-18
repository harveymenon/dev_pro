import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isConfigured: boolean = !!(supabaseUrl && 
                     supabaseAnonKey && 
                     supabaseUrl.startsWith('http') && 
                     supabaseUrl !== 'YOUR_SUPABASE_URL' &&
                     supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY');

// Only create client if properly configured
export const supabase: SupabaseClient | null = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseEnabled: boolean = isConfigured;

// Database schema types
export interface Database {
  developers: {
    id: string;
    name: string;
    color: string;
    created_at?: string;
    updated_at?: string;
  };
  tasks: {
    id: string;
    developer_id: string;
    title: string;
    hours: number;
    start_date: string;
    end_date: string;
    created_at?: string;
    updated_at?: string;
  };
  settings: {
    key: string;
    value: string;
    updated_at?: string;
  };
}
