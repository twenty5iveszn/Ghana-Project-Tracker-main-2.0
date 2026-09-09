import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Returns the client-side Supabase client instance.
 * Safe for browser usage under PostgreSQL Row Level Security (RLS).
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        '[GhanaBuild] Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. Database persistence will be uninitialized until configured.'
      );
    }

    supabaseClient = createClient<Database>(
      supabaseUrl || 'https://placeholder-project.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return supabaseClient;
}

export const supabase = getSupabaseClient();
