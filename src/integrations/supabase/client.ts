
import { createClient } from '@supabase/supabase-js';

// Default Supabase client (for the primary project)
export const supabase = createClient(
  'https://tevmesjpsrsiuwswgzfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldm1lc2pwc3JzaXV3c3dnemZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU5MDE0NzAsImV4cCI6MjAxMTQ3NzQ3MH0.f17IaExMewlrMgG84gkOz-FNB-dJECFGm5ULQKMsQEg'
);

// Store the active client
let activeClient = supabase;

/**
 * Create a custom Supabase client with the provided URL and key
 */
export const createCustomClient = (url: string, key: string) => {
  if (!url || !key) {
    console.error('Invalid Supabase URL or key');
    return null;
  }
  
  console.info('Creating custom Supabase client with URL:', url);
  
  try {
    activeClient = createClient(url, key);
    return activeClient;
  } catch (error) {
    console.error('Error creating custom Supabase client:', error);
    return null;
  }
};

/**
 * Get the active Supabase client (custom or default)
 */
export const getActiveClient = () => {
  return activeClient;
};

/**
 * Test the connection to Supabase
 */
export const testConnection = async (client = activeClient) => {
  try {
    // Attempt a simple query to check if the connection works
    const { data, error } = await client
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      // If users table doesn't exist, try another common table
      const { error: error2 } = await client
        .from('applications_registry')
        .select('count', { count: 'exact', head: true });
      
      if (error2) {
        console.warn('Connection test failed:', error2);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error('Connection test error:', err);
    return false;
  }
};

/**
 * Execute raw SQL using different methods, with fallbacks
 */
export const executeRawSql = async (sql: string) => {
  const client = getActiveClient();
  
  // First try: Direct RPC call to execute_sql function
  try {
    const { data, error } = await client.rpc('execute_sql', { sql_query: sql });
    if (!error) return { data, error: null };
    
    // If we get a specific error about the function not existing, we'll try other methods
    if (error.message?.includes('Could not find the function') || 
        error.code === 'PGRST202') {
      console.warn('SQL function not found, trying alternative method');
    } else {
      throw error;
    }
  } catch (err) {
    console.warn('RPC execution failed, trying alternative method:', err);
  }
  
  // Second try: Use raw PostgreSQL query if available through REST API
  try {
    // For simple SELECT queries, we can try to use Supabase's from().select()
    if (sql.trim().toLowerCase().startsWith('select')) {
      const tableName = extractTableName(sql);
      if (tableName) {
        const { data, error } = await client.from(tableName).select();
        if (!error) return { data, error: null };
      }
    }
    
    // For CREATE TABLE queries, we'll try direct table creation
    if (sql.trim().toLowerCase().startsWith('create table')) {
      // This is a no-op because we can't create tables directly with the JavaScript client
      // We'll need to do this through the Supabase dashboard or SQL editor
      console.info('Table creation needs to be done through Supabase dashboard or SQL editor');
      return { 
        data: null, 
        error: { 
          message: 'Table creation requires SQL editor access in Supabase dashboard'
        }
      };
    }
  } catch (err) {
    console.warn('Alternative method failed:', err);
  }
  
  // Return helpful error if all methods fail
  return { 
    data: null, 
    error: { 
      message: 'Could not execute SQL: The execute_sql function is not available in your Supabase instance. You may need to create this function in your database or use the Supabase dashboard.'
    }
  };
};

/**
 * Helper to extract table name from a SELECT query
 */
function extractTableName(sql: string): string | null {
  // Very basic extraction - doesn't handle complex queries
  const match = sql.match(/from\s+([a-zA-Z0-9_]+)/i);
  return match ? match[1] : null;
}
