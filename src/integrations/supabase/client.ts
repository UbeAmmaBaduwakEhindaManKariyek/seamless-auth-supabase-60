
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default client with the project's Supabase credentials
// This will be overridden with the user's credentials when they connect
export const supabase = createClient<Database>(
  "https://tevmesjpsrsiuwswgzfb.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldm1lc2pwc3JzaXV3c3dnemZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTMwNjksImV4cCI6MjA1MzEyOTA2OX0.ItHcLDWAjDMDre1twpp9yWfEc-VLcTu1Zy09UhgvO1I",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Store for the custom client instance
let customClientInstance: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Create and store a custom Supabase client with user-provided URL and key
 */
export function createCustomClient(url: string, key: string) {
  try {
    if (!url || !key) {
      console.error("Invalid Supabase URL or key");
      return null;
    }

    // Clean the URL by removing trailing slashes if present
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    console.log("Creating custom Supabase client with URL:", cleanUrl);
    customClientInstance = createClient<Database>(cleanUrl, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      // Add custom function to execute SQL queries
      global: {
        // This is needed for backwards compatibility
        headers: {
          'x-my-custom-header': 'custom-value'
        }
      }
    });
    
    return customClientInstance;
  } catch (error) {
    console.error("Error creating custom Supabase client:", error);
    customClientInstance = null;
    return null;
  }
}

/**
 * Execute a raw SQL query using the active Supabase client
 */
export async function executeRawSql(sqlQuery: string) {
  const client = getActiveClient();
  return client.rpc('execute_sql', { sql_query: sqlQuery });
}

/**
 * Get the current active Supabase client
 * Returns the custom client if available, otherwise the default client
 */
export function getActiveClient() {
  return customClientInstance || supabase;
}

/**
 * Reset the custom client instance
 * Useful for logout or when switching users
 */
export function resetCustomClient() {
  customClientInstance = null;
}

/**
 * Check if a custom client is currently active
 */
export function hasCustomClient(): boolean {
  return customClientInstance !== null;
}

// Add the executeRawSql method explicitly to the SupabaseClient type
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc(fn: 'execute_sql', args: { sql_query: string }): Promise<any>;
  }
}
