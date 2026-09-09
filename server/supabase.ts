import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../src/types/database';

dotenv.config();

let serverSupabaseAdmin: SupabaseClient<Database> | null = null;

/**
 * Returns the server-side Supabase Admin client with Service Role privileges.
 * STRICTLY SERVER-SIDE ONLY. Bypasses RLS for authorized administrative workflows,
 * audit logging, and role verification.
 */
export function getServerSupabaseAdmin(): SupabaseClient<Database> {
  if (!serverSupabaseAdmin) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        '[GhanaBuild Server] Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL environment variables.'
      );
    }

    serverSupabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serverSupabaseAdmin;
}

/**
 * Safe accessor for server-side Supabase Admin client.
 * Returns null if environment variables are not yet configured.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  try {
    return getServerSupabaseAdmin();
  } catch {
    return null;
  }
}

