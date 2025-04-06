
import React, { useEffect, useState } from 'react';
import SupabaseSetup from '@/components/supabase/SupabaseSetup';
import InstallTables from '@/components/supabase/InstallTables';
import ExampleDownloads from '@/components/examples/ExampleDownloads';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createCustomClient, executeRawSql, getActiveClient } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, isConnected, checkConnection } = useAuth();
  const [isTestingConnection, setIsTestingConnection] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'failed' | 'checking' | 'none'>('checking');
  const [isCreatingFunction, setIsCreatingFunction] = useState(false);

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
          // Create the execute_sql function if it doesn't exist
          try {
            setIsCreatingFunction(true);
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
            setIsCreatingFunction(false);
          } catch (e) {
            console.log("Error creating execute_sql function, might already exist:", e);
            setIsCreatingFunction(false);
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

  const handleRetryConnection = async () => {
    if (user?.supabaseUrl && user?.supabaseKey) {
      setConnectionStatus('checking');
      setIsTestingConnection(true);
      try {
        createCustomClient(user.supabaseUrl, user.supabaseKey);
        const isConnected = await checkConnection();
        setConnectionStatus(isConnected ? 'connected' : 'failed');
      } catch (error) {
        console.error("Retry connection error:", error);
        setConnectionStatus('failed');
      } finally {
        setIsTestingConnection(false);
      }
    }
  };

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
          <AlertDescription className="flex flex-col gap-4">
            <span>Failed to connect to Supabase. Please verify your URL and API key.</span>
            <div className="flex gap-2">
              <Button onClick={handleRetryConnection} className="bg-blue-600 hover:bg-blue-700">
                Retry Connection
              </Button>
              <Button asChild variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                <Link to="/settings">Check Settings</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
      
      {isCreatingFunction && (
        <Alert className="bg-blue-900 border-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Setting Up SQL Functions</AlertTitle>
          <AlertDescription>
            Creating required SQL functions in your Supabase database...
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupabaseSetup />
        <InstallTables />
      </div>
      
      <ExampleDownloads />
    </div>
  );
};

export default Dashboard;
