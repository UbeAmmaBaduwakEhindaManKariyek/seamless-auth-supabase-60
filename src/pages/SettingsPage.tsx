
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SupabaseSetup from '@/components/supabase/SupabaseSetup';
import { useAuth } from '@/contexts/AuthContext';
import ApiKeyManagement from '@/components/api/ApiKeyManagement';
import AppVersionManager from '@/components/settings/AppVersionManager';
import InstallTables from '@/components/supabase/InstallTables';

const SettingsPage = () => {
  const { isConnected } = useAuth();

  return (
    <div className="container max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <SupabaseSetup />
        
        {isConnected && (
          <>
            <Card className="bg-[#101010] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Supabase Database Setup</CardTitle>
                <CardDescription className="text-gray-400">
                  Install and manage all required tables in your Supabase database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InstallTables />
              </CardContent>
            </Card>
            <AppVersionManager />
            <ApiKeyManagement />
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
