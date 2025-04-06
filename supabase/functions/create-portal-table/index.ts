
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT unique_username_path UNIQUE (username, custom_path)
      );
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
        message: "User portal configuration table created successfully" 
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
