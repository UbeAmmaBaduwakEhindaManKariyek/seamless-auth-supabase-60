
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const InstallTables: React.FC = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isConnected } = useAuth();
  const { toast } = useToast();
  
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
      const supabase = createClient(user.supabaseUrl, user.supabaseKey);
      
      // Define the SQL statements for creating all tables
      const sqlStatements = [
        `
        create table if not exists public.app_version (
          id serial not null,
          version text not null,
          created_at timestamp without time zone null default now(),
          constraint app_version_pkey primary key (id)
        )
        `,
        `
        create table if not exists public.application_open (
          id serial not null,
          username text null,
          ip_address text null,
          hwid text null,
          motherboard_serial text null,
          cpu_serial text null,
          os_version text null,
          ram_capacity text null,
          graphics_card text null,
          storage_capacity text null,
          pc_name text null,
          timestamp timestamp without time zone null default CURRENT_TIMESTAMP,
          constraint application_open_pkey primary key (id)
        )
        `,
        `
        create table if not exists public.subscription_types (
          id uuid not null default gen_random_uuid(),
          name text not null,
          description text null,
          created_at timestamp with time zone not null default timezone('utc'::text, now()),
          is_active boolean null default true,
          price numeric null default 0,
          constraint subscription_types_pkey primary key (id),
          constraint subscription_types_name_key unique (name)
        )
        `,
        `
        create index if not exists idx_subscription_types_name on public.subscription_types using btree (name)
        `,
        `
        create table if not exists public.users (
          id serial not null,
          username text not null,
          password text not null,
          admin_approval boolean null default false,
          subscription text null,
          hwid text[] null,
          expiredate date null,
          key text null,
          hwid_reset_count integer null default 5,
          mobile_number text null,
          banned boolean null default false,
          save_hwid boolean null default true,
          max_devices integer null default 1,
          constraint users_pkey primary key (id),
          constraint users_subscription_fkey foreign key (subscription) references subscription_types (name) on delete set null
        )
        `,
        `
        create index if not exists idx_users_username on public.users using btree (username)
        `,
        `
        create table if not exists public.license_keys (
          id uuid not null default gen_random_uuid(),
          key text not null,
          user_id integer null,
          created_at timestamp with time zone null default timezone('utc'::text, now()),
          expired_at timestamp with time zone null,
          is_active boolean null default true,
          constraint license_keys_pkey primary key (id),
          constraint license_keys_key_key unique (key),
          constraint license_keys_user_id_fkey foreign key (user_id) references users (id)
        )
        `,
        `
        create index if not exists idx_license_keys_user_id on public.license_keys using btree (user_id)
        `,
        `
        create index if not exists idx_license_keys_key on public.license_keys using btree (key)
        `,
        `
        create table if not exists public.login_details (
          id serial not null,
          username text not null,
          ip_address text null,
          hwid text null,
          motherboard_serial text null,
          cpu_serial text null,
          os_version text null,
          ram_capacity text null,
          graphics_card text null,
          storage_capacity text null,
          login_time timestamp without time zone null default now(),
          pc_name text null,
          constraint login_details_pkey primary key (id)
        )
        `,
        `
        create table if not exists public.login_logs (
          id serial not null,
          username text not null,
          status text not null,
          timestamp timestamp without time zone null default now(),
          constraint login_logs_pkey primary key (id)
        )
        `,
        `
        create table if not exists public.messages (
          id serial not null,
          type text not null,
          text text not null,
          constraint messages_pkey primary key (id),
          constraint messages_type_key unique (type)
        )
        `,
        `
        create table if not exists public.regz_cheat_status (
          id serial not null,
          version text not null,
          website_url text not null,
          account_url text not null,
          safety_status text not null,
          constraint regz_cheat_status_pkey primary key (id)
        )
        `,
        `
        create or replace function public.generate_random_key()
        returns trigger
        language plpgsql
        as $function$
        BEGIN
          NEW.key := encode(gen_random_bytes(16), 'hex');
          RETURN NEW;
        END;
        $function$
        `,
        `
        drop trigger if exists tr_generate_key on public.users;
        create trigger tr_generate_key BEFORE INSERT on users for EACH row when (new.key is null)
        execute function generate_random_key();
        `
      ];
      
      // Execute each SQL statement
      for (const sql of sqlStatements) {
        const { error: sqlError } = await supabase.rpc('pgclient', { query: sql });
        if (sqlError) {
          console.error("Error executing SQL:", sqlError);
          setError(`Failed to create tables: ${sqlError.message}`);
          setIsInstalling(false);
          return;
        }
      }
      
      setIsCompleted(true);
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

  return (
    <Card className="bg-[#101010] border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Install Database Tables</CardTitle>
        <CardDescription className="text-gray-400">
          Create all required tables in your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCompleted && (
          <Alert className="bg-green-900 border-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Tables installed successfully</AlertTitle>
            <AlertDescription>
              All database tables have been created in your Supabase project.
            </AlertDescription>
          </Alert>
        )}
        
        {isInstalling && (
          <Alert className="bg-blue-900 border-blue-700">
            <Clock className="h-4 w-4 animate-spin" />
            <AlertTitle>Installing tables...</AlertTitle>
            <AlertDescription>
              Please wait while we create the necessary database tables.
            </AlertDescription>
          </Alert>
        )}

        {error && (
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
            <li>app_version</li>
            <li>application_open</li>
            <li>license_keys</li>
            <li>login_details</li>
            <li>login_logs</li>
            <li>messages</li>
            <li>regz_cheat_status</li>
            <li>subscription_types</li>
            <li>users</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInstall} 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isInstalling || isCompleted || !isConnected}
        >
          {isInstalling ? 'Installing...' : isCompleted ? 'Tables Installed' : 'Install All Tables'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InstallTables;
