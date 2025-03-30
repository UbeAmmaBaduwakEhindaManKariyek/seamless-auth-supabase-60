
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
let customClientInstance: ReturnType<typeof createClient> | null = null;

/**
 * Create and store a custom Supabase client with user-provided URL and key
 */
export function createCustomClient(url: string, key: string) {
  try {
    if (!url || !key) {
      console.error("Invalid Supabase URL or key");
      return null;
    }

    console.log("Creating custom Supabase client with URL:", url);
    customClientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
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
 * Get the current active Supabase client
 * Returns the custom client if available, otherwise the default client
 */
export function getActiveClient() {
  return customClientInstance || supabase;
}
