
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create the SQL for the user portal config table
    const createUserPortalTableSQL = `
      CREATE TABLE IF NOT EXISTS user_portal_config (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        enabled BOOLEAN DEFAULT false,
        custom_path TEXT NOT NULL,
        download_url TEXT,
        application_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT unique_username_path UNIQUE (username, custom_path)
      );
      
      CREATE TABLE IF NOT EXISTS user_portal_auth (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        license_key TEXT NOT NULL,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Add foreign key if license_keys table exists
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'license_keys') THEN
          IF NOT EXISTS (
            SELECT FROM information_schema.constraint_column_usage 
            WHERE table_name = 'user_portal_auth' AND column_name = 'license_key'
          ) THEN
            ALTER TABLE user_portal_auth 
            ADD CONSTRAINT user_portal_auth_license_key_fkey 
            FOREIGN KEY (license_key) REFERENCES license_keys(license_key);
          END IF;
        END IF;
      END
      $$;
    `;

    // Execute SQL to create the tables using the execute_sql function
    const { data, error } = await (Deno as any).env.get("supabase")
      .rpc("execute_sql", { sql_query: createUserPortalTableSQL });
    
    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User portal tables created successfully" 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error creating user portal table:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: String(error) 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 500 
      }
    );
  }
});
