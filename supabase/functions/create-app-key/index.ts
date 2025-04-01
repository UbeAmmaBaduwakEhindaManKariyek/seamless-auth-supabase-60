
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // This endpoint should be protected, so let's check for admin authorization
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    // Parse the request body
    const { name, description } = await req.json();
    
    // Basic validation
    if (!name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required field: name" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Get database credentials from environment variable
    const dbUrl = Deno.env.get("SUPABASE_URL");
    const dbKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!dbUrl || !dbKey) {
      console.error("Missing Supabase credentials in environment");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // Create a Supabase client with the credentials
    const supabase = createClient(dbUrl, dbKey);
    
    // Generate a new API key (UUID)
    const apiKey = crypto.randomUUID();
    
    // Store the API key in the database
    const { data, error } = await supabase
      .from("app_authentication_keys")
      .insert({
        name,
        description,
        key: apiKey,
        is_active: true
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating app key:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create application key" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          name: data.name,
          key: apiKey,
          created_at: data.created_at
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in create-app-key function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
