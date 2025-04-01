
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
    // Parse the request body
    const { username, password, appKey } = await req.json();
    
    // Basic validation
    if (!username || !password || !appKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: username, password, and appKey are required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Get database credentials from environment variable
    // This will be set by the Supabase Edge Function environment
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
    
    // First, authenticate the app key
    // 1. Check if the appKey is valid in a separate table
    const { data: appData, error: appError } = await supabase
      .from("app_authentication_keys")
      .select("*")
      .eq("key", appKey)
      .eq("is_active", true)
      .single();
      
    if (appError || !appData) {
      console.error("Invalid app key:", appError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid application key" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    // 2. Now check the user credentials
    // Depending on your schema, we'll either check users or license_keys
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)  // Note: In production, use proper password hashing
      .single();
      
    if (userError || !userData) {
      // If not found in users table, try license_keys table
      const { data: licenseData, error: licenseError } = await supabase
        .from("license_keys")
        .select("*")
        .eq("mobile_number", username)  // Assuming mobile_number is used as username
        .eq("license_key", password)    // Assuming license_key is used as password
        .single();
        
      if (licenseError || !licenseData) {
        console.error("Authentication failed:", userError || licenseError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid credentials" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401 
          }
        );
      }
      
      // License key authentication successful
      // Log the successful login
      await supabase.from("login_logs").insert({
        username,
        status: "success",
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            username,
            subscription: licenseData.subscription,
            expire_date: licenseData.expire_date,
            hwid: licenseData.hwid,
            banned: licenseData.banned,
            save_hwid: licenseData.save_hwid,
            token: crypto.randomUUID(),  // Generate a session token
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // User authentication successful
    // Log the successful login
    await supabase.from("login_logs").insert({
      username,
      status: "success",
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          username,
          subscription: userData.subscription,
          expire_date: userData.expiredate,
          hwid: userData.hwid,
          banned: userData.banned,
          save_hwid: userData.save_hwid,
          token: crypto.randomUUID(),  // Generate a session token
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in app-auth function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
