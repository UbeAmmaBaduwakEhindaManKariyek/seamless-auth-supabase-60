
import React, { useEffect, useState } from 'react';
import SupabaseSetup from '@/components/supabase/SupabaseSetup';
import InstallTables from '@/components/supabase/InstallTables';
import ExampleDownloads from '@/components/examples/ExampleDownloads';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createCustomClient, executeRawSql } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard: React.FC = () => {
  const { user, isConnected, checkConnection } = useAuth();
  const [isTestingConnection, setIsTestingConnection] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'failed' | 'checking' | 'none'>('checking');

  useEffect(() => {
    const testConnection = async () => {
      if (!user?.supabaseUrl || !user?.supabaseKey) {
        setConnectionStatus('none');
        setIsTestingConnection(false);
        return;
      }

      setIsTestingConnection(true);
      try {
        // Initialize the custom client with the user's credentials
        createCustomClient(user.supabaseUrl, user.supabaseKey);
        
        const isConnected = await checkConnection();
        if (isConnected) {
          // Try to create the execute_sql function if it doesn't exist
          try {
            // Create the execute_sql function using raw SQL
            await executeRawSql(`
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
            `);
          } catch (e) {
            console.log("Error creating execute_sql function, might already exist:", e);
            // Ignore errors, function might already exist
          }
          
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('failed');
        }
      } catch (error) {
        console.error("Active connection test error:", error);
        setConnectionStatus('failed');
      } finally {
        setIsTestingConnection(false);
      }
    };

    testConnection();
  }, [user?.supabaseUrl, user?.supabaseKey, checkConnection]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Manage your application and users</p>
      </div>

      {user && (
        <Card className="bg-[#101010] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Your Supabase Configuration</CardTitle>
            <CardDescription className="text-gray-400">
              These are your Supabase credentials used for connecting to your database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Username:</strong> {user.username}
              </p>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Supabase URL:</strong> {user.supabaseUrl}
              </p>
              <p className="text-sm text-gray-300">
                <strong>Supabase API Key:</strong> {user.supabaseKey?.substring(0, 10)}...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isTestingConnection ? (
        <Alert className="bg-blue-900 border-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Checking Connection</AlertTitle>
          <AlertDescription>
            Verifying your Supabase connection...
          </AlertDescription>
        </Alert>
      ) : connectionStatus === 'connected' ? (
        <Alert className="bg-green-900 border-green-700">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Connected to Supabase</AlertTitle>
          <AlertDescription>
            Your Supabase connection is active and ready to use.
          </AlertDescription>
        </Alert>
      ) : connectionStatus === 'failed' ? (
        <Alert className="bg-red-900 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>
            Failed to connect to Supabase. Please verify your URL and API key.
          </AlertDescription>
        </Alert>
      ) : null}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupabaseSetup />
        <InstallTables />
      </div>
      
      <ExampleDownloads />
    </div>
  );
};

export default Dashboard;
