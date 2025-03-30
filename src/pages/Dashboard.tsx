
import React, { useEffect, useState } from 'react';
import SupabaseSetup from '@/components/supabase/SupabaseSetup';
import InstallTables from '@/components/supabase/InstallTables';
import ExampleDownloads from '@/components/examples/ExampleDownloads';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getActiveClient } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const { user, isConnected } = useAuth();
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
        const client = getActiveClient();
        const { data, error } = await client.from('users').select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error("Active connection test failed:", error);
          setConnectionStatus('failed');
        } else {
          console.log("Active connection test successful");
          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error("Active connection test error:", error);
        setConnectionStatus('failed');
      } finally {
        setIsTestingConnection(false);
      }
    };

    testConnection();
  }, [user?.supabaseUrl, user?.supabaseKey]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Manage your application and users</p>
      </div>
      
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
