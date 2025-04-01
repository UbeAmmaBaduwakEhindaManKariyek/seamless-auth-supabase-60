
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SupabaseSetup from '@/components/supabase/SupabaseSetup';
import { useAuth } from '@/contexts/AuthContext';
import ApiKeyManagement from '@/components/api/ApiKeyManagement';
import AppVersionManager from '@/components/settings/AppVersionManager';

const SettingsPage = () => {
  const { isConnected } = useAuth();

  return (
    <div className="container max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <SupabaseSetup />
        
        {isConnected && (
          <>
            <AppVersionManager />
            <ApiKeyManagement />
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
