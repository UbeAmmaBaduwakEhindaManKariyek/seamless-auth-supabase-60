
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
    const body = await req.json();
    const { action, username, password, license_key } = body;
    
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
    
    // Handle different actions
    if (action === "login") {
      // Validate required fields for login
      if (!username || !password) {
        return new Response(
          JSON.stringify({ success: false, error: "Username and password are required" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      
      // Check if user exists in user_portal_auth
      const { data: userData, error: userError } = await supabase
        .from("user_portal_auth")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();
      
      if (userError || !userData) {
        console.error("Login failed:", userError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid username or password" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401 
          }
        );
      }
      
      // Update last login time
      await supabase
        .from("user_portal_auth")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userData.id);
      
      // Get license key details
      const { data: licenseData, error: licenseError } = await supabase
        .from("license_keys")
        .select("*")
        .eq("license_key", userData.license_key)
        .single();
      
      if (licenseError || !licenseData) {
        console.error("License key not found:", licenseError);
        return new Response(
          JSON.stringify({ success: false, error: "License key not found or invalid" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401 
          }
        );
      }
      
      // Return user data with license information
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            ...userData,
            subscription: licenseData.subscription,
            expiredate: licenseData.expiredate,
            banned: licenseData.banned,
            token: crypto.randomUUID() // Generate session token
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } 
    else if (action === "register") {
      // Validate required fields for registration
      if (!username || !password || !license_key) {
        return new Response(
          JSON.stringify({ success: false, error: "Username, password, and license key are required" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      
      // Check if username already exists
      const { data: existingUser, error: existingUserError } = await supabase
        .from("user_portal_auth")
        .select("id")
        .eq("username", username)
        .single();
        
      if (existingUser) {
        return new Response(
          JSON.stringify({ success: false, error: "Username already exists" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409 
          }
        );
      }
      
      // Verify license key exists and is valid
      const { data: licenseData, error: licenseError } = await supabase
        .from("license_keys")
        .select("*")
        .eq("license_key", license_key)
        .single();
        
      if (licenseError || !licenseData) {
        console.error("Invalid license key:", licenseError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid license key" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      
      // Create user in user_portal_auth table
      const { data: newUser, error: newUserError } = await supabase
        .from("user_portal_auth")
        .insert({
          username,
          password,
          license_key,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select()
        .single();
        
      if (newUserError) {
        console.error("Error creating user:", newUserError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create user" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
      
      // Create user entry in users table if it doesn't exist
      const { error: userError } = await supabase
        .from("users")
        .insert({
          username: username,
          password: password, 
          subscription: licenseData.subscription,
          expiredate: licenseData.expiredate,
          hwid: licenseData.hwid,
          save_hwid: licenseData.save_hwid,
          max_devices: licenseData.max_devices,
          banned: licenseData.banned,
          mobile_number: licenseData.mobile_number
        })
        .select()
        .single();
      
      // Return success response
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            ...newUser,
            message: "User registered successfully"
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 201 
        }
      );
    }
    else if (action === "reset_hwid") {
      // Validate required fields for HWID reset
      if (!username || !password) {
        return new Response(
          JSON.stringify({ success: false, error: "Username and password are required" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      
      // Check if user exists in user_portal_auth
      const { data: userData, error: userError } = await supabase
        .from("user_portal_auth")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();
      
      if (userError || !userData) {
        console.error("Authentication failed:", userError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid username or password" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401 
          }
        );
      }
      
      // Get license key details
      const { data: licenseData, error: licenseError } = await supabase
        .from("license_keys")
        .select("*")
        .eq("license_key", userData.license_key)
        .single();
      
      if (licenseError || !licenseData) {
        console.error("License key not found:", licenseError);
        return new Response(
          JSON.stringify({ success: false, error: "License key not found or invalid" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401 
          }
        );
      }
      
      // Check if user has remaining HWID resets
      if (licenseData.hwid_reset_count <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: "No HWID resets remaining" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403 
          }
        );
      }
      
      // Reset HWID in license_keys table
      const { error: resetError } = await supabase
        .from("license_keys")
        .update({ 
          hwid: [],
          hwid_reset_count: licenseData.hwid_reset_count - 1
        })
        .eq("license_key", userData.license_key);
      
      if (resetError) {
        console.error("Error resetting HWID:", resetError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to reset HWID" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
      
      // Also update users table if the user exists there
      await supabase
        .from("users")
        .update({ hwid: [] })
        .eq("username", username);
      
      // Return success response
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            message: "HWID reset successful",
            resets_remaining: licenseData.hwid_reset_count - 1
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
  } catch (error) {
    console.error("Error in portal-auth function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
