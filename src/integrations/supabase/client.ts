
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { toast } from '@/components/ui/use-toast';

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
 * Handles errors and returns the result
 */
export async function executeRawSql(sqlQuery: string) {
  const client = getActiveClient();
  try {
    const { data, error } = await client.rpc('execute_sql', { sql_query: sqlQuery });
    
    if (error) {
      console.error("SQL execution error:", error);
      
      // Check if the error is due to the function not existing yet
      if (error.message.includes("function") && error.message.includes("does not exist")) {
        toast({
          title: "SQL Function Missing",
          description: "The execute_sql function is not available in your Supabase project. Please visit the Settings page to set up required functions.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "SQL Execution Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return { error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("executeRawSql failed:", error);
    toast({
      title: "SQL Execution Failed",
      description: "An unexpected error occurred while executing SQL",
      variant: "destructive",
    });
    return { error };
  }
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

/**
 * Ensure all required tables are accessible to the active client
 * Checks a list of essential tables to see if the connection can access them
 */
export async function checkRequiredTables() {
  const client = getActiveClient();
  const requiredTables = [
    'users',
    'subscription_types',
    'license_keys',
    'login_details',
    'login_logs',
    'messages',
    'regz_cheat_status',
    'app_version',
    'application_open',
    'applications_registry',
    'app_authentication_keys'
  ];
  
  const results: Record<string, boolean> = {};
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      const { error } = await client
        .from(table)
        .select('count', { count: 'exact', head: true })
        .limit(1);
        
      results[table] = !error;
      if (error) {
        allTablesExist = false;
      }
    } catch (e) {
      results[table] = false;
      allTablesExist = false;
    }
  }
  
  return { allTablesExist, tableResults: results };
}

// Add the executeRawSql method explicitly to the SupabaseClient type
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc(fn: 'execute_sql', args: { sql_query: string }): Promise<any>;
  }
}
