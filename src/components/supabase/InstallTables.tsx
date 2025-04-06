
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { getActiveClient, executeRawSql } from '@/integrations/supabase/client';

const InstallTables: React.FC = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingTables, setIsCheckingTables] = useState(true);
  const [tablesExist, setTablesExist] = useState<boolean>(false);
  const [needsManualInstall, setNeedsManualInstall] = useState(false);
  const { user, isConnected } = useAuth();
  const { toast } = useToast();
  
  // Check if tables already exist
  useEffect(() => {
    const checkTables = async () => {
      if (!user?.supabaseUrl || !user?.supabaseKey || !isConnected) {
        setIsCheckingTables(false);
        return;
      }
      
      try {
        const supabase = getActiveClient();
        
        // Try to check if users table exists (one of the main tables)
        const { data, error } = await supabase
          .from('users')
          .select('count', { count: 'exact', head: true });
          
        if (!error) {
          setTablesExist(true);
          setIsCompleted(true);
        } else {
          setTablesExist(false);
        }
      } catch (error) {
        console.error("Error checking tables:", error);
        setTablesExist(false);
      } finally {
        setIsCheckingTables(false);
      }
    };
    
    checkTables();
  }, [user, isConnected]);
  
  const handleInstall = async () => {
    if (!user?.supabaseUrl || !user?.supabaseKey) {
      toast({
        title: "Missing Supabase configuration",
        description: "Please save your Supabase URL and API key first",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Not connected to Supabase",
        description: "Please ensure your Supabase connection is active before installing tables",
        variant: "destructive",
      });
      return;
    }
    
    setIsInstalling(true);
    setError(null);
    
    try {
      // First check if execute_sql function exists
      const { error: functionCheckError } = await executeRawSql(`SELECT 1`);
      
      if (functionCheckError && functionCheckError.message?.includes('execute_sql function is not available')) {
        setNeedsManualInstall(true);
        setError("The execute_sql function is not available in your Supabase database. Please follow the manual installation instructions.");
        setIsInstalling(false);
        return;
      }
      
      // Use the active Supabase client
      const supabase = getActiveClient();
      
      // Define the SQL statements for creating all tables
      const sqlStatements = [
        // Generate Random Key function
        `
        CREATE OR REPLACE FUNCTION public.generate_random_key()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.key := gen_random_uuid()::TEXT;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `,
        
        // Subscription Types table
        `
        CREATE TABLE IF NOT EXISTS public.subscription_types (
          id UUID NOT NULL DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
          is_active BOOLEAN NULL DEFAULT true,
          price NUMERIC NULL DEFAULT 0,
          CONSTRAINT subscription_types_pkey PRIMARY KEY (id),
          CONSTRAINT subscription_types_name_key UNIQUE (name)
        );
        `,
        
        // Create index for subscription_types
        `CREATE INDEX IF NOT EXISTS idx_subscription_types_name ON public.subscription_types USING btree (name);`,
        
        // Default subscription type
        `
        INSERT INTO public.subscription_types (name, description, price)
        VALUES ('default', 'Default subscription type', 0)
        ON CONFLICT (name) DO NOTHING;
        `,
        
        // Users table
        `
        CREATE TABLE IF NOT EXISTS public.users (
          id SERIAL NOT NULL,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          admin_approval BOOLEAN NULL DEFAULT false,
          subscription TEXT NULL DEFAULT 'default',
          hwid TEXT[] NULL,
          expiredate DATE NULL,
          key TEXT NULL,
          hwid_reset_count INTEGER NULL DEFAULT 5,
          mobile_number TEXT NULL,
          banned BOOLEAN NULL DEFAULT false,
          save_hwid BOOLEAN NULL DEFAULT true,
          max_devices INTEGER NULL DEFAULT 1,
          CONSTRAINT users_pkey PRIMARY KEY (id)
        );
        `,
        
        // Create index for users
        `CREATE INDEX IF NOT EXISTS idx_users_username ON public.users USING btree (username);`,
        
        // Add trigger for generate_random_key
        `
        DROP TRIGGER IF EXISTS tr_generate_key ON users;
        CREATE TRIGGER tr_generate_key 
          BEFORE INSERT ON users 
          FOR EACH ROW 
          WHEN (NEW.key IS NULL)
          EXECUTE FUNCTION generate_random_key();
        `,
        
        // Add foreign key constraints after tables exist
        `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_subscription'
          ) THEN
            ALTER TABLE public.users 
            ADD CONSTRAINT fk_user_subscription 
            FOREIGN KEY (subscription) 
            REFERENCES subscription_types (name);
          END IF;
        END $$;
        `,
        
        `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'users_subscription_fkey'
          ) THEN
            ALTER TABLE public.users 
            ADD CONSTRAINT users_subscription_fkey 
            FOREIGN KEY (subscription) 
            REFERENCES subscription_types (name) 
            ON DELETE SET NULL;
          END IF;
        END $$;
        `,
        
        // Regz Cheat Status table
        `
        CREATE TABLE IF NOT EXISTS public.regz_cheat_status (
          id SERIAL NOT NULL,
          version TEXT NOT NULL,
          website_url TEXT NOT NULL,
          account_url TEXT NOT NULL,
          safety_status TEXT NOT NULL,
          CONSTRAINT regz_cheat_status_pkey PRIMARY KEY (id)
        );
        `,
        
        // Messages table
        `
        CREATE TABLE IF NOT EXISTS public.messages (
          id SERIAL NOT NULL,
          type TEXT NOT NULL,
          text TEXT NOT NULL,
          CONSTRAINT messages_pkey PRIMARY KEY (id),
          CONSTRAINT messages_type_key UNIQUE (type)
        );
        `,
        
        // Insert default messages
        `
        INSERT INTO public.messages (type, text)
        VALUES 
          ('login_success', 'Welcome'),
          ('welcome', 'Welcome to Regz Cheat'),
          ('error', 'error')
        ON CONFLICT (type) DO NOTHING;
        `,
        
        // Login Logs table
        `
        CREATE TABLE IF NOT EXISTS public.login_logs (
          id SERIAL NOT NULL,
          username TEXT NOT NULL,
          status TEXT NOT NULL,
          timestamp TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
          CONSTRAINT login_logs_pkey PRIMARY KEY (id)
        );
        `,
        
        // Login Details table
        `
        CREATE TABLE IF NOT EXISTS public.login_details (
          id SERIAL NOT NULL,
          username TEXT NOT NULL,
          ip_address TEXT NULL,
          hwid TEXT NULL,
          motherboard_serial TEXT NULL,
          cpu_serial TEXT NULL,
          os_version TEXT NULL,
          ram_capacity TEXT NULL,
          graphics_card TEXT NULL,
          storage_capacity TEXT NULL,
          login_time TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
          pc_name TEXT NULL,
          CONSTRAINT login_details_pkey PRIMARY KEY (id)
        );
        `,
        
        // License Keys table
        `
        CREATE TABLE IF NOT EXISTS public.license_keys (
          id SERIAL NOT NULL,
          license_key TEXT NOT NULL,
          admin_approval BOOLEAN NULL DEFAULT false,
          subscription TEXT NULL DEFAULT 'default',
          hwid TEXT[] NULL,
          expiredate DATE NULL,
          key TEXT NULL,
          hwid_reset_count INTEGER NULL DEFAULT 5,
          mobile_number TEXT NULL,
          banned BOOLEAN NULL DEFAULT false,
          save_hwid BOOLEAN NULL DEFAULT true,
          max_devices INTEGER NULL DEFAULT 1,
          CONSTRAINT license_keys_pkey PRIMARY KEY (id)
        );
        `,
        
        // Create index for license_keys
        `CREATE INDEX IF NOT EXISTS idx_license_keys ON public.license_keys USING btree (license_key);`,
        
        // Add foreign key for license_keys
        `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_subscription'
          ) THEN
            ALTER TABLE public.license_keys 
            ADD CONSTRAINT fk_subscription 
            FOREIGN KEY (subscription) 
            REFERENCES subscription_types (name) 
            ON DELETE SET NULL;
          END IF;
        END $$;
        `,
        
        // Applications Registry table
        `
        CREATE TABLE IF NOT EXISTS public.applications_registry (
          id BIGSERIAL NOT NULL,
          name TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          version TEXT NOT NULL,
          app_secret TEXT NOT NULL,
          is_active BOOLEAN NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
          CONSTRAINT applications_registry_pkey PRIMARY KEY (id)
        );
        `,
        
        // App Version table
        `
        CREATE TABLE IF NOT EXISTS public.app_version (
          id SERIAL NOT NULL,
          version TEXT NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT now(),
          CONSTRAINT app_version_pkey PRIMARY KEY (id)
        );
        `,
        
        // Insert default app version
        `
        INSERT INTO public.app_version (version)
        SELECT '1.0'
        WHERE NOT EXISTS (SELECT 1 FROM public.app_version);
        `,
        
        // App Authentication Keys table
        `
        CREATE TABLE IF NOT EXISTS public.app_authentication_keys (
          id UUID NOT NULL DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          key TEXT NOT NULL,
          description TEXT NULL,
          is_active BOOLEAN NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
          created_by UUID NULL,
          CONSTRAINT app_authentication_keys_pkey PRIMARY KEY (id),
          CONSTRAINT app_authentication_keys_key_key UNIQUE (key)
        );
        `,
        
        // Create index for app_authentication_keys
        `CREATE INDEX IF NOT EXISTS idx_api_keys ON public.app_authentication_keys USING btree (key);`,
        
        // Application Open table
        `
        CREATE TABLE IF NOT EXISTS public.application_open (
          id SERIAL NOT NULL,
          username TEXT NULL,
          ip_address TEXT NULL,
          hwid TEXT NULL,
          motherboard_serial TEXT NULL,
          cpu_serial TEXT NULL,
          os_version TEXT NULL,
          ram_capacity TEXT NULL,
          graphics_card TEXT NULL,
          storage_capacity TEXT NULL,
          pc_name TEXT NULL,
          timestamp TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT application_open_pkey PRIMARY KEY (id)
        );
        `,
        
        // Create the execute_sql function if it doesn't exist
        `
        CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
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
        `
      ];
      
      // Execute each SQL statement
      for (let i = 0; i < sqlStatements.length; i++) {
        try {
          const sql = sqlStatements[i];
          console.log(`Executing SQL statement ${i + 1}/${sqlStatements.length}`);
          
          // Try to use executeRawSql first
          try {
            const { error: sqlError } = await executeRawSql(sql);
            
            if (sqlError) {
              throw sqlError;
            }
          } catch (rpcError) {
            console.error("Error executing SQL statement, cannot proceed:", rpcError);
            throw rpcError;
          }
        } catch (err) {
          console.error(`Error executing SQL statement ${i + 1}:`, err);
          if (i < 2) {
            // Critical error in initial statements
            setError(`Failed to create basic tables: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setIsInstalling(false);
            toast({
              title: "Installation failed",
              description: "Failed to install tables. See error message for details.",
              variant: "destructive",
            });
            return;
          }
          // Continue with next statements if non-critical error
          console.warn("Continuing with next statements...");
        }
      }
      
      setIsCompleted(true);
      setTablesExist(true);
      toast({
        title: "Tables installed successfully",
        description: "All required database tables have been created",
      });
    } catch (err) {
      console.error("Installation error:", err);
      setError(`Installation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast({
        title: "Installation failed",
        description: "Failed to install tables. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const openSupabaseDashboard = () => {
    if (user?.supabaseUrl) {
      const dashboardUrl = user.supabaseUrl.replace('.supabase.co', '.supabase.co/project/sql');
      window.open(dashboardUrl, '_blank');
    }
  };

  return (
    <Card className="bg-[#101010] border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Install Database Tables</CardTitle>
        <CardDescription className="text-gray-400">
          Create all required tables in your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCheckingTables ? (
          <div className="flex items-center space-x-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking for existing tables...</span>
          </div>
        ) : tablesExist ? (
          <Alert className="bg-green-900 border-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Tables already exist</AlertTitle>
            <AlertDescription>
              All necessary database tables have been found in your Supabase project.
            </AlertDescription>
          </Alert>
        ) : isCompleted ? (
          <Alert className="bg-green-900 border-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Tables installed successfully</AlertTitle>
            <AlertDescription>
              All database tables have been created in your Supabase project.
            </AlertDescription>
          </Alert>
        ) : null}
        
        {isInstalling && (
          <Alert className="bg-blue-900 border-blue-700">
            <Clock className="h-4 w-4 animate-spin" />
            <AlertTitle>Installing tables...</AlertTitle>
            <AlertDescription>
              Please wait while we create the necessary database tables.
            </AlertDescription>
          </Alert>
        )}

        {needsManualInstall && (
          <Alert className="bg-amber-900 border-amber-700">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Manual Installation Required</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>The execute_sql function is not available in your Supabase database. You'll need to create this function manually or use the Supabase SQL editor to create tables.</p>
              <Button 
                variant="outline" 
                className="flex items-center bg-amber-800 hover:bg-amber-700 border-amber-600"
                onClick={openSupabaseDashboard}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase SQL Editor
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {error && !needsManualInstall && (
          <Alert className="bg-red-900 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Installation Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <h3 className="text-white font-medium">The following tables will be created:</h3>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            <li>subscription_types</li>
            <li>users</li>
            <li>license_keys</li>
            <li>login_details</li>
            <li>login_logs</li>
            <li>messages</li>
            <li>regz_cheat_status</li>
            <li>app_version</li>
            <li>application_open</li>
            <li>applications_registry</li>
            <li>app_authentication_keys</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInstall} 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isInstalling || (!isConnected) || tablesExist || needsManualInstall}
        >
          {isInstalling ? 'Installing...' : tablesExist ? 'Tables Already Installed' : 'Install All Tables'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InstallTables;
