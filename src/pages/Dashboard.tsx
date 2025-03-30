
import React from 'react';
import SupabaseSetup from '@/components/supabase/SupabaseSetup';
import InstallTables from '@/components/supabase/InstallTables';
import ExampleDownloads from '@/components/examples/ExampleDownloads';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isConnected } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Manage your application and users</p>
      </div>
      
      {isConnected && (
        <Alert className="bg-green-900 border-green-700">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Connected to Supabase</AlertTitle>
          <AlertDescription>
            Your Supabase connection is active and ready to use.
          </AlertDescription>
        </Alert>
      )}
      
      {!isConnected && user?.supabaseUrl && user?.supabaseKey && (
        <Alert className="bg-red-900 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>
            Failed to connect to Supabase. Please verify your URL and API key.
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
