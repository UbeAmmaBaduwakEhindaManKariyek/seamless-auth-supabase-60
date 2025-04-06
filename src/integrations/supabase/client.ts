
// This file is automatically generated. Do not edit it directly.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tevmesjpsrsiuwswgzfb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldm1lc2pwc3JzaXV3c3dnemZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTMwNjksImV4cCI6MjA1MzEyOTA2OX0.ItHcLDWAjDMDre1twpp9yWfEc-VLcTu1Zy09UhgvO1I";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// The default client for the application
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Custom client instance for user-specific connections
let activeClient: SupabaseClient = supabase;

/**
 * Creates a custom Supabase client with the provided URL and key
 */
export const createCustomClient = (url: string, key: string): SupabaseClient => {
  activeClient = createClient(url, key);
  return activeClient;
};

/**
 * Gets the active Supabase client (either the default or a custom one)
 */
export const getActiveClient = (): SupabaseClient => {
  return activeClient;
};

/**
 * Execute raw SQL queries on the active Supabase client
 */
export const executeRawSql = async (sqlQuery: string): Promise<{ data: any; error: any }> => {
  try {
    // Using any to bypass type checking for the RPC function
    const { data, error } = await (activeClient as any).rpc('execute_sql', { sql_query: sqlQuery });
    
    if (error && error.message?.includes('Could not find the function')) {
      return { 
        data: null, 
        error: { 
          ...error,
          message: 'execute_sql function is not available' 
        } 
      };
    }
    
    return { data, error };
  } catch (error) {
    console.error('Error executing raw SQL:', error);
    return { data: null, error };
  }
};

/**
 * Test the connection to a Supabase instance
 */
export const testConnection = async (client: SupabaseClient): Promise<boolean> => {
  try {
    const { error } = await (client as any).from('users').select('count', { count: 'exact', head: true });
    
    if (!error) {
      return true;
    }
    
    // Try another table if the first one doesn't exist
    const { error: secondError } = await (client as any).from('web_login_regz').select('count', { count: 'exact', head: true });
    
    return !secondError;
  } catch (err) {
    console.error('Connection test error:', err);
    return false;
  }
};
