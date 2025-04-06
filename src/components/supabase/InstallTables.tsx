import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const InstallTables = () => {
  const { toast } = useToast();
  const { isConnected } = useAuth();
  const [installStatuses, setInstallStatuses] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({
    basicTables: 'idle',
    loginTracking: 'idle',
    apiTables: 'idle',
    userPortalTable: 'idle',
  });

  const installBasicTables = async () => {
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        supabase_url VARCHAR(255),
        supabase_key VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`,
      `CREATE TABLE IF NOT EXISTS license_keys (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        expiredate TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        admin_approval BOOLEAN DEFAULT FALSE,
        banned BOOLEAN DEFAULT FALSE,
        hwid TEXT[],
        hwid_reset_count INTEGER DEFAULT 0,
        max_devices INTEGER DEFAULT 1,
        mobile_number VARCHAR(20),
        save_hwid BOOLEAN DEFAULT TRUE,
        subscription VARCHAR(100),
        username VARCHAR(50)
      );`,
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        duration INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        features JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`,
      `CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        headers JSONB,
        payload JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`,
      `CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        log_level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`,
    ];

    try {
      for (const sql of sqlCommands) {
        const { error } = await (supabase as any).rpc('execute_sql', { sql_query: sql });
        if (error) throw error;
      }
      return { message: 'Basic tables installed successfully' };
    } catch (error: any) {
      console.error("Error installing basic tables:", error);
      throw new Error(`Failed to install basic tables: ${error.message}`);
    }
  };

  const installLoginTables = async () => {
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS login_details (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        login_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
        ip_address VARCHAR(50),
        location VARCHAR(100),
        device_info JSONB
      );`,
      `CREATE TABLE IF NOT EXISTS app_open_details (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        open_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
        app_version VARCHAR(50),
        os_version VARCHAR(50),
        device_info JSONB
      );`,
    ];

    try {
      for (const sql of sqlCommands) {
        const { error } = await (supabase as any).rpc('execute_sql', { sql_query: sql });
        if (error) throw error;
      }
      return { message: 'Login tracking tables installed successfully' };
    } catch (error: any) {
      console.error("Error installing login tracking tables:", error);
      throw new Error(`Failed to install login tracking tables: ${error.message}`);
    }
  };

  const installApiTables = async () => {
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        api_key VARCHAR(255) UNIQUE NOT NULL,
        description VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`,
      `CREATE TABLE IF NOT EXISTS api_requests (
        id SERIAL PRIMARY KEY,
        api_key_id INTEGER REFERENCES api_keys(id),
        request_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
        endpoint VARCHAR(255) NOT NULL,
        request_body JSONB,
        response_status INTEGER,
        response_body JSONB
      );`,
    ];

    try {
      for (const sql of sqlCommands) {
        const { error } = await (supabase as any).rpc('execute_sql', { sql_query: sql });
        if (error) throw error;
      }
      return { message: 'API tables installed successfully' };
    } catch (error: any) {
      console.error("Error installing API tables:", error);
      throw new Error(`Failed to install API tables: ${error.message}`);
    }
  };

  const installFunctions = [
    {
      name: "Basic Tables",
      description: "Install core tables like users, licenses, etc.",
      action: installBasicTables,
    },
    {
      name: "Login Tracking",
      description: "Install tables for tracking user logins and app opens",
      action: installLoginTables,
    },
    {
      name: "API Tables",
      description: "Install tables for API keys and webhook management",
      action: installApiTables,
    },
    {
      name: "User Portal Table",
      description: "Install table for user portal configuration",
      action: async () => {
        const { data, error } = await supabase.functions.invoke("create-portal-table");
        if (error) throw new Error(`Error creating user portal table: ${error.message}`);
        return data;
      },
    },
  ];

  const handleInstall = async (index: number) => {
    const installFunction = installFunctions[index];
    const key = installFunction.name.replace(/\s+/g, '').toLowerCase();

    setInstallStatuses(prev => ({ ...prev, [key]: 'loading' }));

    try {
      await installFunction.action();
      setInstallStatuses(prev => ({ ...prev, [key]: 'success' }));
      toast({
        title: "Installation Success",
        description: `${installFunction.name} installed successfully.`,
      });
    } catch (error: any) {
      console.error(`Error installing ${installFunction.name}:`, error);
      setInstallStatuses(prev => ({ ...prev, [key]: 'error' }));
      toast({
        title: "Installation Error",
        description: `Failed to install ${installFunction.name}: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-[#101010] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Install Tables</CardTitle>
        <CardDescription className="text-gray-400">
          Install the necessary tables in your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {installFunctions.map((item, index) => {
          const key = item.name.replace(/\s+/g, '').toLowerCase();
          return (
            <div key={index} className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
              <Button
                onClick={() => handleInstall(index)}
                disabled={installStatuses[key] === 'loading' || !isConnected}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {installStatuses[key] === 'loading' ? 'Installing...' : 'Install'}
                {installStatuses[key] === 'success' && <CheckCircle className="ml-2 h-4 w-4" />}
                {installStatuses[key] === 'error' && <XCircle className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default InstallTables;
