
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

// Store for the custom client instance and its credentials
let customClientInstance: ReturnType<typeof createClient<Database>> | null = null;
let customClientUrl: string | null = null;
let customClientKey: string | null = null;

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
    
    // If we already have a client with the same credentials, return it
    if (customClientInstance && 
        customClientUrl === cleanUrl && 
        customClientKey === key) {
      return customClientInstance;
    }
    
    customClientInstance = createClient<Database>(cleanUrl, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-my-custom-header': 'custom-value'
        }
      }
    });
    
    // Store the URL and key for later comparison
    customClientUrl = cleanUrl;
    customClientKey = key;
    
    return customClientInstance;
  } catch (error) {
    console.error("Error creating custom Supabase client:", error);
    customClientInstance = null;
    customClientUrl = null;
    customClientKey = null;
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
  customClientUrl = null;
  customClientKey = null;
}

/**
 * Check if a custom client is currently active
 */
export function hasCustomClient(): boolean {
  return customClientInstance !== null;
}

/**
 * Test the connection to the Supabase instance
 * Returns true if the connection is successful, false otherwise
 */
export async function testConnection(client = getActiveClient()) {
  try {
    const { error } = await client.from('applications_registry')
      .select('count', { count: 'exact', head: true })
      .limit(1);
      
    if (error) {
      // Try an alternative table if applications_registry doesn't exist
      const { error: altError } = await client.from('web_login_regz')
        .select('count', { count: 'exact', head: true })
        .limit(1);
        
      return !altError;
    }
    
    return true;
  } catch (error) {
    console.error("Test connection failed:", error);
    return false;
  }
}

// Add the executeRawSql method explicitly to the SupabaseClient type
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc(fn: 'execute_sql', args: { sql_query: string }): Promise<any>;
  }
}
