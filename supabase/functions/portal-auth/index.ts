
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
      
      console.log(`Login attempt for username: ${username}`);
      
      // First check if user exists in users table directly
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();
      
      if (userError || !userData) {
        console.log("User not found in users table, checking user_portal_auth");
        
        // If not found in users table, try the user_portal_auth table
        const { data: portalUserData, error: portalUserError } = await supabase
          .from("user_portal_auth")
          .select("*")
          .eq("username", username)
          .eq("password", password)
          .single();
        
        if (portalUserError || !portalUserData) {
          console.error("Login failed - user not found in any tables");
          return new Response(
            JSON.stringify({ success: false, error: "Invalid username or password" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401 
            }
          );
        }
        
        // Found in user_portal_auth but not in users
        // Update last login time
        await supabase
          .from("user_portal_auth")
          .update({ last_login: new Date().toISOString() })
          .eq("id", portalUserData.id);
        
        // Get license key details
        const { data: licenseData, error: licenseError } = await supabase
          .from("license_keys")
          .select("*")
          .eq("license_key", portalUserData.license_key)
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
        
        console.log("Login successful via user_portal_auth");
        
        // Return user data with license information
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              ...portalUserData,
              subscription: licenseData.subscription,
              expiredate: licenseData.expiredate,
              banned: licenseData.banned,
              token: crypto.randomUUID()
            }
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }
      
      // User found in the main users table
      console.log("User found in users table");
      
      // Update last login time in user_portal_auth if exists
      const { data: existingAuth } = await supabase
        .from("user_portal_auth")
        .select("id")
        .eq("username", username)
        .maybeSingle();
        
      if (existingAuth?.id) {
        await supabase
          .from("user_portal_auth")
          .update({ last_login: new Date().toISOString() })
          .eq("id", existingAuth.id);
      } else {
        // Create an entry in user_portal_auth if it doesn't exist
        await supabase
          .from("user_portal_auth")
          .insert({
            username: username,
            password: password,
            license_key: userData.key || ""
          });
      }
      
      // Get license information - first try from userData.key
      let licenseData;
      if (userData.key) {
        const { data: licenseByKey, error: licenseKeyError } = await supabase
          .from("license_keys")
          .select("*")
          .eq("license_key", userData.key)
          .maybeSingle();
          
        if (!licenseKeyError && licenseByKey) {
          licenseData = licenseByKey;
        }
      }
      
      // If not found by key, try using the username (some systems link username to license)
      if (!licenseData) {
        const { data: licenseByUser, error: licenseUserError } = await supabase
          .from("license_keys")
          .select("*")
          .eq("license_key", username)
          .maybeSingle();
          
        if (!licenseUserError && licenseByUser) {
          licenseData = licenseByUser;
        }
      }
      
      console.log("Login successful via users table");
      
      // Return user data with license information if available
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            ...userData,
            subscription: userData.subscription || (licenseData?.subscription || ""),
            expiredate: userData.expiredate || (licenseData?.expiredate || null),
            banned: userData.banned !== undefined ? userData.banned : (licenseData?.banned || false),
            token: crypto.randomUUID()
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
      
      console.log(`Registration attempt for username: ${username} with license: ${license_key}`);
      
      // Check if username already exists in users table
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle();
        
      if (existingUser) {
        return new Response(
          JSON.stringify({ success: false, error: "Username already exists" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409 
          }
        );
      }
      
      // Check if username already exists in user_portal_auth
      const { data: existingPortalUser, error: existingPortalUserError } = await supabase
        .from("user_portal_auth")
        .select("id")
        .eq("username", username)
        .maybeSingle();
        
      if (existingPortalUser) {
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
        console.error("Error creating user in user_portal_auth:", newUserError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create user" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
      
      console.log("Created user in user_portal_auth");
      
      // Create user entry in users table if it doesn't exist
      const { data: newMainUser, error: userError } = await supabase
        .from("users")
        .insert({
          username: username,
          password: password, 
          subscription: licenseData.subscription,
          expiredate: licenseData.expiredate,
          hwid: licenseData.hwid || [],
          save_hwid: licenseData.save_hwid,
          max_devices: licenseData.max_devices,
          banned: licenseData.banned,
          mobile_number: licenseData.mobile_number,
          key: license_key
        })
        .select()
        .single();
      
      if (userError) {
        console.error("Error creating user in users table:", userError);
        // Continue anyway since the user was successfully created in user_portal_auth
      } else {
        console.log("Created user in users table");
      }
      
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
      
      console.log(`HWID reset attempt for username: ${username}`);
      
      // Check if user exists in user_portal_auth
      const { data: userData, error: userError } = await supabase
        .from("user_portal_auth")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .maybeSingle();
      
      // If not found in user_portal_auth, try the users table
      if (userError || !userData) {
        const { data: mainUserData, error: mainUserError } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .eq("password", password)
          .maybeSingle();
          
        if (mainUserError || !mainUserData) {
          console.error("Authentication failed for HWID reset");
          return new Response(
            JSON.stringify({ success: false, error: "Invalid username or password" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401 
            }
          );
        }
        
        // User found in users table
        const licenseKey = mainUserData.key;
        
        if (!licenseKey) {
          console.error("No license key found for user");
          return new Response(
            JSON.stringify({ success: false, error: "No license key associated with this account" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400 
            }
          );
        }
        
        // Check for hwid_reset_count directly in users table first
        if (mainUserData.hwid_reset_count !== undefined && mainUserData.hwid_reset_count <= 0) {
          return new Response(
            JSON.stringify({ success: false, error: "No HWID resets remaining" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 403 
            }
          );
        }
        
        // Get license key details if needed
        let licenseData;
        if (mainUserData.hwid_reset_count === undefined) {
          const { data: licenseInfo, error: licenseError } = await supabase
            .from("license_keys")
            .select("*")
            .eq("license_key", licenseKey)
            .maybeSingle();
            
          if (!licenseError && licenseInfo) {
            licenseData = licenseInfo;
            
            // Check if user has remaining HWID resets in license_keys
            if (licenseData.hwid_reset_count !== undefined && licenseData.hwid_reset_count <= 0) {
              return new Response(
                JSON.stringify({ success: false, error: "No HWID resets remaining" }),
                { 
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                  status: 403 
                }
              );
            }
          }
        }
        
        // Reset HWID in users table
        const { error: resetUserError } = await supabase
          .from("users")
          .update({ 
            hwid: []
          })
          .eq("username", username);
        
        if (resetUserError) {
          console.error("Error resetting HWID in users table:", resetUserError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to reset HWID" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500 
            }
          );
        }
        
        // Also update license_keys table if we have a valid license key
        if (licenseKey) {
          const { error: resetLicenseError } = await supabase
            .from("license_keys")
            .update({ 
              hwid: []
            })
            .eq("license_key", licenseKey);
            
          // Decrement hwid_reset_count if it exists
          if (!resetLicenseError) {
            // Update users table hwid_reset_count if it exists
            if (mainUserData.hwid_reset_count !== undefined) {
              await supabase
                .from("users")
                .update({ 
                  hwid_reset_count: mainUserData.hwid_reset_count - 1
                })
                .eq("username", username);
            }
            
            // Update license_keys table hwid_reset_count if it exists
            if (licenseData && licenseData.hwid_reset_count !== undefined) {
              await supabase
                .from("license_keys")
                .update({ 
                  hwid_reset_count: licenseData.hwid_reset_count - 1
                })
                .eq("license_key", licenseKey);
            }
          }
        }
        
        // Return success response
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              message: "HWID reset successful",
              resets_remaining: mainUserData.hwid_reset_count !== undefined ? mainUserData.hwid_reset_count - 1 : 
                                (licenseData?.hwid_reset_count !== undefined ? licenseData.hwid_reset_count - 1 : null)
            }
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }
      
      // User found in user_portal_auth
      // Get license key details
      const { data: licenseData, error: licenseError } = await supabase
        .from("license_keys")
        .select("*")
        .eq("license_key", userData.license_key)
        .maybeSingle();
      
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
      if (licenseData.hwid_reset_count !== undefined && licenseData.hwid_reset_count <= 0) {
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
          hwid_reset_count: licenseData.hwid_reset_count !== undefined ? licenseData.hwid_reset_count - 1 : undefined
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
        .update({ 
          hwid: [],
          hwid_reset_count: licenseData.hwid_reset_count !== undefined ? licenseData.hwid_reset_count - 1 : undefined
        })
        .eq("username", username);
      
      // Return success response
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            message: "HWID reset successful",
            resets_remaining: licenseData.hwid_reset_count !== undefined ? licenseData.hwid_reset_count - 1 : null
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
