import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
