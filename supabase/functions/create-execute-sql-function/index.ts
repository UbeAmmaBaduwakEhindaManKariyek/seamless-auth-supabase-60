
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
    // Get the Supabase client
    const supabaseClient = Deno.env.get("SUPABASE_CLIENT");
    const supabaseKey = Deno.env.get("SUPABASE_KEY");
    
    if (!supabaseClient || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create SQL function to execute raw SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE sql_query;
        result = '{"success": true}'::JSONB;
        RETURN result;
      EXCEPTION WHEN OTHERS THEN
        result = jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'detail', SQLSTATE
        );
        RETURN result;
      END;
      $$;
    `;

    // Execute the SQL to create the function
    const response = await fetch(`${supabaseClient}/rest/v1/rpc/execute_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql_query: createFunctionSQL }),
    });

    const result = await response.json();

    // Handle errors from create function query
    if (result.error) {
      // If the execute_sql function doesn't exist yet, we need to create it directly
      const directResponse = await fetch(`${supabaseClient}/rest/v1/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "params=single-object",
        },
        body: JSON.stringify({
          query: createFunctionSQL,
        }),
      });

      const directResult = await directResponse.json();

      if (directResponse.ok) {
        return new Response(
          JSON.stringify({ message: "SQL function created successfully" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            error: "Failed to create SQL function directly",
            details: directResult,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ message: "SQL function created successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating SQL function:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
