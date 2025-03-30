
import React from 'react';
import SupabaseSetup from '@/components/supabase/SupabaseSetup';
import InstallTables from '@/components/supabase/InstallTables';
import ExampleDownloads from '@/components/examples/ExampleDownloads';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Manage your application and users</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupabaseSetup />
        <InstallTables />
      </div>
      
      <ExampleDownloads />
    </div>
  );
};

export default Dashboard;
